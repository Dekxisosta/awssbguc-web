import Link from "next/link";
import { LoginForm } from "@/src/features/auth";
import { AuthShell } from "@/src/widgets/auth-shell";

export const loginMetadata = {
  title: "Sign in — AWSSBG-UC",
};

interface LoginPageProps {
  redirectTo?: string;
}

export function LoginPage({ redirectTo }: LoginPageProps) {
  return (
    <AuthShell
      title="Sign in"
      sub={
        redirectTo === "/member"
          ? "Sign in to complete your membership registration."
          : "AWSSBG-UC member portal"
      }
      bubble="I don't bite"
    >
      <LoginForm redirectTo={redirectTo} />

      <p className="mt-6 text-center text-base">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="underline underline-offset-4 hover:bg-black hover:text-[#fff7a1] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#2c8f8f]"
        >
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

/* Keep BrandPanel exported so other files that import it don't break */
export function BrandPanel(_props: { heading: string; sub: string }) {
  return null;
}
