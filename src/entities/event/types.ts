export type EventStatus = "not_started" | "ongoing" | "completed" | "cancelled";
export type RegistrationStatus = "registered" | "attended" | "not_attended";

export interface EventRow {
  event_id: string;
  name: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  status: EventStatus;
}

export interface RegistrationRow {
  event_id: string;
  status: RegistrationStatus;
}
