import { lifecycleHandler } from "@/modules/catalog/lifecycle-http";
export const runtime = "nodejs";
export const POST = lifecycleHandler("reopen");
