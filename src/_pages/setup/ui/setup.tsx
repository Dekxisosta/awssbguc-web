import Image from "next/image";
import { SetupForm } from "@/src/features/auth";

export const setupMetadata = {
  title: "Set up your account — AWSSBG-UC",
};

interface SetupPageProps {
  memberId?: string | null;
}

export function SetupPage({ memberId }: SetupPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2.5">
            <Image src="/icons/logo.webp" alt="AWSSBG-UC logo" width={32} height={32} className="rounded-sm object-contain" />
            <span className="text-sm font-semibold tracking-tight">AWSSBG-UC</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Set your password</h1>
          <p className="mt-1.5 text-sm text-neutral-400">
            Your account has been pre-provisioned with a temporary password.
            Choose a permanent password to continue.
          </p>
          {memberId && (
            <p className="mt-2 font-mono text-xs text-neutral-500">
              Member ID: {memberId}
            </p>
          )}
        </div>
        <SetupForm />
        <form action="/api/auth/logout" method="POST" className="mt-6 text-center">
          <button
            type="submit"
            className="text-xs text-neutral-500 underline-offset-2 hover:text-neutral-400 hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
