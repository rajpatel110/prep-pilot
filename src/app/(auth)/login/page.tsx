import { AuthForm } from "@/shared/ui/auth-form";
import { serverConfig } from "@/shared/server/config";
import { studentReturn } from "@/modules/identity/student-routing";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const returnTo = studentReturn((await searchParams).returnTo);
  return (
    <>
      <h1>Welcome back</h1>
      <p className="section-copy">Sign in to continue your preparation.</p>
      <AuthForm
        mode="login"
        enabled={serverConfig.AUTH_ENABLED}
        emailMode={serverConfig.EMAIL_MODE}
        returnTo={returnTo}
      />
    </>
  );
}
