import { AuthForm } from "@/shared/ui/auth-form";
import { serverConfig } from "@/shared/server/config";
export default function LoginPage() {
  return (
    <>
      <h1>Welcome back</h1>
      <p className="section-copy">Sign in to continue your preparation.</p>
      <AuthForm
        mode="login"
        enabled={serverConfig.AUTH_ENABLED}
        emailMode={serverConfig.EMAIL_MODE}
      />
    </>
  );
}
