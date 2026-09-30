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
