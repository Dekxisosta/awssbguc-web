import { PixelNotFound } from "@/src/shared/ui/PixelNotFound";

export default function MemberNotFound() {
  return (
    <PixelNotFound
      title="No public profile here"
      message="This member either doesn't exist or hasn't shared their profile. Only members who opt into the directory get a public page."
      backHref="/members"
      backLabel="Back to the directory"
    />
  );
}
