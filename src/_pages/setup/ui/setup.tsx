import { SetupForm } from "@/src/features/auth";
import { linkBtn } from "@/src/features/auth/ui/pixel-form";
import { AuthShell } from "@/src/widgets/auth-shell";

export const setupMetadata = {
  title: "Set up your account — AWSSBG-UC",
};

interface SetupPageProps {
  memberId?: string | null;
}

/**
 * First sign-in for a provisioned account: swap the temporary password for a permanent one.
 * Same frame as sign-in / sign-up (AuthShell), so it reads as part of the same flow.
 */
export function SetupPage({ memberId }: SetupPageProps) {
  return (
    <AuthShell
      title="Set password"
      sub="Your account was pre-provisioned with a temporary password. Choose a permanent one to continue."
      bubble="Make it a good one"
    >
      {memberId && (
        <p className="mb-6 flex flex-wrap items-center gap-2 text-base">
          <span className="border-4 border-black bg-black px-2 py-0.5 text-sm uppercase tracking-wide text-pix-butter">
            Member ID
          </span>
          <span className="break-all">{memberId}</span>
        </p>
      )}

      <SetupForm />

      <form action="/api/auth/logout" method="POST" className="mt-6 text-center text-base">
        Wrong account?{" "}
        <button type="submit" className={linkBtn}>
          Sign out
        </button>
      </form>
    </AuthShell>
  );
}
