import { ConvexHttpClient } from "convex/browser";
import { config } from "../config/environment";
import { api } from "../../convex/_generated/api";

const convexUrl = config.convex.url;

if (!convexUrl) {
  throw new Error("CONVEX_URL environment variable is not set");
}

export const convexClient = new ConvexHttpClient(convexUrl);

export { api };
