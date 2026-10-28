import { AuthForm } from "@/shared/ui/auth-form";
import { serverConfig } from "@/shared/server/config";
import { studentReturn } from "@/modules/identity/student-routing";
import { redirectSignedInAuth } from "@/modules/identity/page-access";
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const returnTo = studentReturn((await searchParams).returnTo);
  if (serverConfig.AUTH_ENABLED) await redirectSignedInAuth(returnTo);
  return (
    <>
      <h1>Create your account</h1>
      <p className="section-copy">
        Start with a clear direction for your preparation.
      </p>
      <AuthForm
        mode="signup"
        enabled={serverConfig.AUTH_ENABLED}
        emailMode={serverConfig.EMAIL_MODE}
        deliveryMode={serverConfig.EMAIL_DELIVERY_MODE}
        returnTo={returnTo}
      />
    </>
  );
}
