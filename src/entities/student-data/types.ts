/**
 * Student data a participant can see and ask to have corrected.
 *
 * Only the fields the participant typed in themselves at membership
 * registration are editable. student_number is the membership link and stays
 * read-only; contact details / date of birth are shown when present on
 * historical rows but are not part of the change-request flow.
 */

export const EDITABLE_FIELDS = [
  "first_name",
  "middle_name",
  "last_name",
  "year_level",
  "program",
  "section",
] as const;

export type EditableField = (typeof EDITABLE_FIELDS)[number];

export type StudentValues = Record<EditableField, string | null>;

export type ChangeRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface ChangeRequest {
  request_id: string;
  student_number: string;
  /** Old values of the changed fields, as the participant saw them. */
  current_values: Partial<StudentValues>;
  /** New values; only changed fields are present. */
  requested_values: Partial<StudentValues>;
  reason: string;
  status: ChangeRequestStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

/** Read-only extras that historical rows may carry. Shown, never editable. */
export interface StudentExtras {
  contact_number: string | null;
  email: string | null;
  date_of_birth: string | null;
}
