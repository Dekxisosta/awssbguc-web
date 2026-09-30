import Image from "next/image";
import Link from "next/link";
import { RegisterForm } from "@/src/features/auth";

export const signupMetadata = {
  title: "Sign up — AWSSBG-UC",
};

export function SignupPage() {
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
              Create your account
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Your member ID is assigned after officer verification.
            </p>
          </div>
        </div>

        <RegisterForm />

        <p className="mt-6 text-center text-xs text-neutral-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-neutral-400 underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
