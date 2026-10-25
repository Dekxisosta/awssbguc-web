import { loginMetadata } from "@/src/_pages/login";
import { LoginPage } from "@/src/_pages/login";

export const metadata = loginMetadata;

interface Props {
  searchParams: Promise<{ redirect?: string; redirectTo?: string }>;
}

export default async function LoginRoute({ searchParams }: Props) {
  // Middleware sends `redirectTo`; in-app links use `redirect`. Accept both.
  const { redirect: redirectParam, redirectTo: redirectToParam } = await searchParams;
  const redirect = redirectParam ?? redirectToParam;
  // Allow only internal paths to prevent open-redirect
  const redirectTo =
    redirect && redirect.startsWith("/") && !redirect.startsWith("//")
      ? redirect
      : undefined;

  return <LoginPage redirectTo={redirectTo} />;
}
