import { loginMetadata } from "@/src/_pages/login";
import { LoginPage } from "@/src/_pages/login";

export const metadata = loginMetadata;

interface Props {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginRoute({ searchParams }: Props) {
  const { redirect } = await searchParams;
  // Allow only internal paths to prevent open-redirect
  const redirectTo =
    redirect && redirect.startsWith("/") && !redirect.startsWith("//")
      ? redirect
      : undefined;

  return <LoginPage redirectTo={redirectTo} />;
}
