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
 * Public-safe member profile for the members overview page.
 * Contains only voluntarily shared or non-sensitive fields.
 * Sensitive fields (name, email, student_number, qr_token, etc.) are excluded.
 *
 * member_id is the SBG-UC-YYXXXX badge when the participant has a membership,
 * or the participant_id UUID used as a stable key when they don't.
 */
export interface PublicMemberProfile {
  /** SBG-UC-YYXXXX when linked to a membership, participant UUID otherwise. */
  member_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  github_username: string | null;
  discord_id: string | null;
}
