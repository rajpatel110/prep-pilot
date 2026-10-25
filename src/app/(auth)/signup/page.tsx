import { AuthForm } from "@/shared/ui/auth-form";
import { serverConfig } from "@/shared/server/config";
export default function SignupPage() {
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
      />
    </>
  );
}
