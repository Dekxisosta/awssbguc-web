# Account Creation

There are two ways a member account gets created in the AWS SBG UC system.

---

## Identity Model

```
auth.users
    │
    │  user_id (FK)
    ▼
participants  ←──── member_roster (optional, via member_roster_id)
    │
    │  profile_id (same UUID as user_id)
    ▼
profiles  (app settings: username, discord, github, avatar)
```

**Auth lives on `participants`.** `participants.user_id` is the foreign key to `auth.users.id`. This makes participants the canonical identity layer — not `profiles`.

`profiles` is an optional app-settings attachment (username, social handles, avatar, setup state). It shares the same UUID as `participants.user_id` but is not the identity anchor.

A participant may exist without an account (`user_id = null`) — this is the state for seeded members awaiting provisioning.

---

## 1. Normal Registration (Self-Service)

The member creates their own account through the website.

### Who this is for

Anyone who wants to register and has not already been provisioned.

### Flow

1. Member goes to `/signup`.
2. Fills in:
   - Full name
   - Email address
   - Password
3. Submits the form.
4. The server:
   - Validates the inputs.
   - Creates the Supabase Auth account with the chosen password.
   - Creates a `profiles` row with `initial_setup_completed = true`.
   - Creates a `participants` row with `user_id` set to the new `auth.users.id`.
     `member_roster_id` is `null` until an admin links a membership.
5. Member can sign in immediately at `/login`.

### Result

| Table | Column | Value |
|---|---|---|
| `auth.users` | `id` | new UUID |
| `participants` | `user_id` | = `auth.users.id` |
| `participants` | `member_roster_id` | `null` (linked by admin later) |
| `profiles` | `profile_id` | = `auth.users.id` |
| `profiles` | `initial_setup_completed` | `true` |

### Notes

- The member chooses their own permanent password. No temporary password is involved.
- Membership linking (connecting `participants.member_roster_id` to a `member_roster` row) is a separate admin action performed after identity verification.

---

## 2. Admin Provisioning (Pre-Provisioned Account)

An administrator creates an account on behalf of an existing member.

### Who this is for

Members who are already in `member_roster` (seeded from the spreadsheet) but have not registered themselves. Typically used for batch onboarding.

### Prerequisites

- The member must have a seeded `participants` row with `member_roster_id` set and `user_id = null`.
- The `ADMIN_API_SECRET` environment variable must be set on the server.

### Flow

1. Admin calls `POST /api/admin/provision` with the member ID and email address.

   **Single member:**
   ```json
   { "memberId": "SBG-UC-260001", "email": "member@example.com" }
   ```

   **Bulk (up to 100 at a time):**
   ```json
   {
     "members": [
       { "memberId": "SBG-UC-260001", "email": "member1@example.com" },
       { "memberId": "SBG-UC-260002", "email": "member2@example.com" }
     ]
   }
   ```

   The request must include the admin secret:
   ```
   Authorization: Bearer <ADMIN_API_SECRET>
   ```

2. The server:
   - Fetches the `member_roster` row by `memberId`.
   - Checks the linked `participants` row — rejects if `user_id` is already set.
   - Derives the member's full name from `student_data`.
   - Generates a cryptographically random temporary password.
   - Creates the Supabase Auth account.
   - Creates a `profiles` row with `initial_setup_completed = false`.
   - Sets `participants.user_id` to the new `auth.users.id` — this is the call that gives the participant their auth anchor.
   - Returns the temporary password **once** in the response.

3. Admin distributes the temporary password to the member through a controlled channel (Discord DM, in person, etc.).

4. Member signs in at `/login` with their email and the temporary password.

5. The system detects `initial_setup_completed = false` and redirects to `/setup`.

6. Member chooses a permanent password.

7. `profiles.initial_setup_completed` is set to `true`. The temporary password is no longer valid.

8. Member is redirected to `/dashboard`.

### Result

| Table | Column | Value |
|---|---|---|
| `auth.users` | `id` | new UUID |
| `participants` | `user_id` | = `auth.users.id` (set during provisioning) |
| `participants` | `member_roster_id` | pre-existing seeded value |
| `profiles` | `profile_id` | = `auth.users.id` |
| `profiles` | `initial_setup_completed` | `false` → `true` after setup |

### Important

- The temporary password is **never stored** in the database, logs, or any application table.
- It exists only in the API response at the moment of provisioning.
- If a member loses their temporary password before completing setup, an admin must reset it manually via the Supabase dashboard or a password reset operation.

---

## Account State After Creation

Both flows converge on the same account model once setup is complete.

```
Pre-provisioned                    Normal registration
      │                                   │
Login with temporary password      Login with chosen password
      │                                   │
Redirected to /setup               Redirected to /dashboard
      │
Choose permanent password
      │
Redirected to /dashboard
      │
      └──────────────────────────────────┘
                     │
              Normal account
   participants.user_id       = auth.users.id
   profiles.initial_setup_completed = true
```

---

## Password Rules

Passwords chosen by the member (at `/signup` or `/setup`) must meet the following requirements:

- At least 8 characters
- At most 72 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

Passwords are never stored in `participants`, `profiles`, `member_roster`, `student_data`, or any application table. They are managed entirely by Supabase Auth.
