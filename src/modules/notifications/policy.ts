export type EmailConfiguration = {
  AUTH_ENABLED: boolean;
  APP_URL: string;
  EMAIL_MODE: "test" | "live";
  EMAIL_DELIVERY_MODE: "disabled" | "owner_test" | "restricted" | "live";
  EMAIL_PROVIDER?: "resend" | "brevo";
  EMAIL_TEST_RECIPIENTS?: string[];
  BREVO_API_KEY?: string | undefined;
  BREVO_SENDER_EMAIL?: string | undefined;
  BREVO_SENDER_NAME?: string | undefined;
  EMAIL_TEST_RECIPIENT?: string | undefined;
  RESEND_API_KEY?: string | undefined;
  RESEND_FROM_EMAIL?: string | undefined;
};
export function emailAllowed(config: EmailConfiguration, email: string) {
  return (
    config.AUTH_ENABLED &&
    (config.EMAIL_DELIVERY_MODE === "live" ||
      (config.EMAIL_DELIVERY_MODE === "restricted" &&
        config.EMAIL_TEST_RECIPIENTS?.includes(email.toLowerCase()) === true) ||
      (config.EMAIL_DELIVERY_MODE === "owner_test" &&
        email.toLowerCase() === config.EMAIL_TEST_RECIPIENT))
  );
}
export function emailAvailability(config: EmailConfiguration) {
  return {
    deliveryMode: config.EMAIL_DELIVERY_MODE,
    emailMode: config.EMAIL_MODE,
    passwordRecovery:
      config.AUTH_ENABLED && config.EMAIL_DELIVERY_MODE !== "disabled",
  };
}
