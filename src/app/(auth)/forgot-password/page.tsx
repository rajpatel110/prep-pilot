import { EmailPanel } from "@/modules/identity/ui/email-panel";
import { emailAvailability } from "@/modules/notifications/policy";
import { serverConfig } from "@/shared/server/config";
export default function ForgotPassword() {
  return (
    <EmailPanel mode="forgot" availability={emailAvailability(serverConfig)} />
  );
}
