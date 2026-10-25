import { themeInitialization } from "@/shared/ui/theme-script";

export const dynamic = "force-static";

export function GET() {
  return new Response(themeInitialization, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
