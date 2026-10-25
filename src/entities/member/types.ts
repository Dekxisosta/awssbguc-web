export interface StudentDataRow {
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  year_level: string | null;
  program: string | null;
  section: string | null;
}

export interface MembershipRow {
  member_id: string;
  student_number: string;
  student_data: StudentDataRow | null;
}

/**
 * Public-safe member profile for the members directory page.
 * Sourced from the `public_member_profiles` view (migration 20260006).
 *
 * Only accounts that have explicitly opted in (directory_visible = true) AND
 * have at least one social link set are returned by that view.
 *
 * Sensitive fields (name, email, student_number, qr_token, profile_id, etc.)
 * are never included here.
 *
 * member_id is the SBG-UC-YYXXXX badge when the participant has a membership,
 * or the participant_id UUID used as a stable React key when they don't.
 */
export interface PublicMemberProfile {
  /** SBG-UC-YYXXXX when linked to a membership, participant UUID otherwise. */
  member_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  github_username: string | null;
  /** Short public bio set by the user (max 280 chars). Null when not set. */
  bio: string | null;
  /** Self-reported skill tags, e.g. ["Python", "AWS", "React"]. Null when not set. */
  skills: string[] | null;
}

/**
 * Public member profile for the detail page at /members/[username].
 * Same public-safe fields as the directory card: the page reads the same
 * `public_member_profiles` view, so a member only has a page when they have
 * opted into the directory.
 */
export type PublicMemberDetail = PublicMemberProfile;

/** An event a public member is going to / went to, from `event_public_attendees` joined to `events`. */
export interface MemberEventSummary {
  event_id: string;
  slug: string;
  name: string;
  summary: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string;
  location: string | null;
  status: "not_started" | "ongoing" | "completed" | "cancelled";
}
