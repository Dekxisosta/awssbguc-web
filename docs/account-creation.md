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

## 1. Normal Registration (Self-Service Wizard)

The member creates their own account through a multi-step form at `/signup`, modelled on a Google Form: required fields are marked, optional sections can be skipped, and **nothing is created until the final submit**.

### Who this is for

Anyone who wants to register and has not already been provisioned.

### Steps

| Step | Fields | Required? |
|---|---|---|
| 1. Account | Full name, email, password, confirm password | Yes |
| 2. Profile | Photo, username, Discord ID, GitHub username, skills, bio | No |
| 3. Membership | Student number, first / middle / last name, year level, program, section | No (all-or-nothing) |
| 4. Review | Summary with Edit links, Terms / Privacy agreement | Agreement required |

Answers are held in browser memory only (including the password). Refreshing the page loses them; the browser warns before that happens.

### Uniqueness flagging

Values that must be unique are checked as the user moves through the form, via `POST /api/auth/check-availability` (backed by the `check_registration_availability()` SQL function). This only reads; it creates nothing.

| Field | Unique against |
|---|---|
| Email | `auth.users` and `participants.email` (case-insensitive) |
| Username | `profiles.username` (case-insensitive) |
| Discord ID | `profiles.discord_id` |
| GitHub username | `profiles.github_username` (case-insensitive) |
| Student number | `member_roster.student_number` |

A taken value is flagged on blur and blocks **Next** until it is changed (or, for optional fields, cleared). If the check cannot run (network error, rate limit) the user may continue; the final submit re-checks.

### Final submit: `POST /api/auth/register`

Body: `{ email, fullName, password, profile?, membership? }`. The server re-validates everything and re-checks uniqueness, then:

1. Creates the Supabase Auth user.
2. Creates the `profiles` row (`initial_setup_completed = true`, plus any profile details). A chosen username sets `username_changed_at` (uses up the one-time change); otherwise a username is auto-generated.
3. Creates the `participants` row (`user_id` = the new `auth.users.id`).
4. Steps 1-3 are the **account**. If any of them fails, the auth user is deleted and nothing is left behind.
5. If membership fields were supplied, calls `register_member_self_reported()` and links the result to the participant. **This is what makes the person a member.** A failure here does not undo the account; it is returned as `membership: { status: "failed", ... }` and the user can retry from `/membership`.

The browser then signs the user in and, if a photo was chosen, uploads it to `/api/profile/avatar` (it needs a signed-in user). A failed upload is reported but does not affect the account.

### Result

| Table | Column | Value |
|---|---|---|
| `auth.users` | `id` | new UUID |
| `participants` | `user_id` | = `auth.users.id` |
| `participants` | `member_roster_id` | `null` unless membership fields were filled in |
| `profiles` | `profile_id` | = `auth.users.id` |
| `profiles` | `initial_setup_completed` | `true` |

### Notes

- Creating an account does not make someone a member. Supplying the membership fields does.
- The member chooses their own permanent password. No temporary password is involved.

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
- If a member loses their temporary password, or an admin wants to replace a password, use **Reissue temporary password** in the member's details panel (Members tab) or the API below.

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

---

## Reissuing a Temporary Password

`POST /api/admin/provision/reissue` with `{ "participantId": "<uuid>", "sendEmail": true }` replaces an existing account's password with a new temporary one and sends the member back through `/setup` (`profiles.initial_setup_completed = false`).

```bash
curl -X POST https://your-site/api/admin/provision/reissue \
  -H "Authorization: Bearer $ADMIN_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "participantId": "<participant uuid>", "sendEmail": true }'
```

- Allowed for an admin's browser session or the `ADMIN_API_SECRET` bearer token. **Accounts that hold the admin role can only be reissued with the secret.**
- The new password goes to the email on the auth account. It is returned in the response only when it was not emailed successfully.
- Existing signed-in sessions are **not** ended; the old password simply stops working for new sign-ins.
- A 60-second per-member cooldown applies (best effort, per server instance). Each reissue is logged on the server.
- You can't reissue your own password from a browser session.
