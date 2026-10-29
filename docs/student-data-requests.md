# Student Data: View & Change Requests

Members can see the student data stored for their membership and ask for corrections. Nothing is edited
directly. A request is reviewed by staff, and only an approval changes `student_data`.

## Member flow (`/membership`)

The current record (member ID, student number, name, year level, program, section) is also shown read-only in the
**Membership** tile on `/profile`, with a **History & changes** button that opens this page. Requests, their
status and past decisions live here only.

1. The page shows the linked record: member ID, student number, name, year level, program, section. Email,
   contact number and date of birth also appear when a historical row has them (read-only).
2. **Request a change** opens a form pre-filled with the current values. The member edits what's wrong and
   gives a reason (10-500 characters). Only fields that actually differ are sent.
3. While a request is pending the member sees it (old → new, reason) and can **withdraw** it. One pending
   request per member; at most 5 requests per rolling 24 h.
4. Decided requests appear under **Past requests** with status and the reviewer's note.

Editable: first / middle / last name, year level, program, section.
Not editable here: student number (primary key and membership link) - an admin handles that.

## Staff flow (`/admin` → Requests)

Needs the `student_data.review` permission (granted to `super_admin` and `admin` by migration 20260015).
The tab shows a badge with the pending count. Each card shows the old and requested values and the reason.
If the live record no longer matches what the member saw when filing, a warning shows what it reads now.

- **Approve & apply**: updates `student_data` and marks the request approved, in one transaction.
- **Reject**: a note is required, and the member sees it.

## Pieces

| Layer | File |
|---|---|
| Schema, RLS, permission, review function | `supabase/migrations/20260015_student_data_change_requests.sql` |
| Shared fields / validation (browser + API) | `src/entities/student-data/` |
| Loads the caller's own record (service role) | `src/shared/lib/student-data/service.ts` |
| Member API: `POST /api/member/change-requests`, `DELETE /api/member/change-requests/[id]` | `src/_app/api-routes/member/change-request.ts` |
| Admin API: `GET /api/admin/student-data-requests`, `PATCH .../[id]` | `src/_app/api-routes/admin/student-data-requests.ts` |
| Member UI | `src/features/student-data-request/` |
| Admin UI | `RequestsTab` in `src/_pages/admin/ui/admin.tsx` |

## Security notes

- `student_data` has no client RLS policy, so `/membership` reads it server-side with the service role, keyed only by
  the signed-in user's id. The student number is never taken from a request body.
- `student_data_change_requests` is readable by its owner through RLS; all writes are service-role only.
- The editable-column whitelist is enforced in the API **and** by a CHECK constraint on the table.
- The review function locks the request row, so two reviewers can't both act on the same request.

## Not included (possible follow-ups)

- Email notification when a request is decided (the mail lib currently only sends credential emails).
- Editing the student number, or contact details / date of birth.
