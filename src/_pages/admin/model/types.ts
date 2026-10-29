export interface Stats {
  participantCount: number;
  memberCount: number;
  accountCount: number;
  eventCount: number;
  registrationCount: number;
}

export interface MemberRow {
  participant_id: string;
  display_name: string;
  supplied_name: string;
  email: string | null;
  status: string;
  member_roster_id: string | null;
  user_id: string | null;
  participant_roles: { role: string; granted_at: string }[];
  profiles: { username: string | null; avatar_url: string | null; initial_setup_completed: boolean } | null;
}

export interface EventScheduleItem {
  starts_at: string;
  ends_at?: string;
  title: string;
  speaker?: string;
  description?: string;
}

/** An event as the admin API returns it: every column of `events` (drafts included) plus registration counts. */
export interface EventRow {
  event_id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  cover_image_url: string | null;
  format: "in_person" | "online" | "hybrid";
  location: string | null;
  location_address: string | null;
  location_url: string | null;
  timezone: string;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  host_name: string | null;
  tags: string[];
  schedule: EventScheduleItem[] | null;
  is_published: boolean;
  status: "not_started" | "ongoing" | "completed" | "cancelled";
  registrations: { registered: number; attended: number; not_attended: number };
}

export type Row = Record<string, unknown>;

export interface PersonRow {
  participantId: string;
  displayName: string;
  suppliedName: string;
  email: string | null;
  status: string;
  userId: string | null;
  memberId: string | null;
  roles: string[];
  profile: Row | null;
  student: {
    student_number: string; first_name: string | null; middle_name: string | null; last_name: string | null;
    year_level: string | null; program: string | null; section: string | null; email: string | null;
  } | null;
  events: { registered: number; attended: number; notAttended: number };
}

export interface PersonDetail {
  participant: Row;
  roles: { role: string; granted_at: string }[];
  profile: Row | null;
  roster: Row | null;
  student: Row | null;
  registrations: {
    event_id: string; name: string; location: string | null; starts_at: string | null; ends_at: string | null;
    event_status: EventRow["status"] | null; status: string; affiliation: string | null; note: string | null;
    registered_at: string | null;
  }[];
}

export interface PendingMember {
  memberId: string;
  studentNumber: string;
  name: string;
  email: string | null;
}

export interface PendingMembersResponse {
  members: PendingMember[];
  accountCount: number;
  mailConfigured: boolean;
}

export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface ChangeRequestRow {
  request_id: string;
  student_number: string;
  current_values: Record<string, string | null>;
  requested_values: Record<string, string | null>;
  /** What the student record reads right now for the changed fields (null if the record is gone). */
  live_values: Record<string, string | null> | null;
  reason: string;
  status: RequestStatus;
  review_note: string | null;
  reviewed_at: string | null;
  reviewer_name: string | null;
  created_at: string;
  participant: { display_name: string; supplied_name: string; email: string | null; member_id: string | null } | null;
}

export type RegistrationStatus = "registered" | "attended" | "not_attended";

/** One row of the registrations sheet: a registration joined with who the person is. */
export interface RegistrationRow {
  participantId: string;
  name: string;
  username: string | null;
  email: string | null;
  memberId: string | null;
  studentNumber: string | null;
  program: string | null;
  yearLevel: string | null;
  section: string | null;
  affiliation: string | null;
  note: string | null;
  status: RegistrationStatus;
  registeredAt: string;
}

export interface RegistrationSheetData {
  event: {
    event_id: string;
    name: string;
    location: string | null;
    starts_at: string;
    ends_at: string;
    status: EventRow["status"];
    capacity: number | null;
  };
  rows: RegistrationRow[];
}

/** Hit from the people directory, used when adding attendees by hand. */
export interface PersonHit {
  participantId: string;
  displayName: string;
  suppliedName: string;
  email: string | null;
  memberId: string | null;
}

/** One row of the audit log (migration 20260017). */
export interface AuditEntry {
  id: string;
  createdAt: string;
  action: string;
  outcome: "success" | "denied" | "failed";
  via: "session" | "api_secret" | "system";
  actorLabel: string | null;
  targetLabel: string | null;
  details: Record<string, unknown>;
}
