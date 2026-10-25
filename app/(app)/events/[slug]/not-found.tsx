import { PixelNotFound } from "@/src/shared/ui/PixelNotFound";

export default function EventNotFound() {
  return (
    <PixelNotFound
      title="Event not found"
      message="That event doesn't exist, or it hasn't been published yet. Check the link, or look through the full list."
      backHref="/events"
      backLabel="See all events"
    />
  );
}
