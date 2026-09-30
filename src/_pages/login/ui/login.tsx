import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/src/features/auth";

export const loginMetadata = {
  title: "Sign in — AWSSBG-UC",
};

interface LoginPageProps {
  redirectTo?: string;
}

export function LoginPage({ redirectTo }: LoginPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 px-4 py-16">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image
            src="/icons/logo.webp"
            alt="AWSSBG-UC logo"
            width={44}
            height={44}
            className="rounded-md object-contain"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-neutral-100">
              Sign in
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {redirectTo === "/member"
                ? "Sign in to complete your membership registration."
                : "AWSSBG-UC member portal"}
            </p>
          </div>
        </div>

        <LoginForm redirectTo={redirectTo} />

        <p className="mt-6 text-center text-xs text-neutral-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-neutral-400 underline-offset-2 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

/* Keep BrandPanel exported so other files that import it don't break */
export function BrandPanel(_props: { heading: string; sub: string }) {
  return null;
}
