import "server-only";
import { getServerEnv } from "./env";

export const serverConfig = getServerEnv();
