import { AuthFrame } from "@/shared/ui/auth-frame";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthFrame>{children}</AuthFrame>;
}
