import { auth, ensureAuthReady } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth.handler);

export const GET = async (...args: Parameters<typeof handler.GET>) => {
  await ensureAuthReady();
  return handler.GET(...args);
};

export const POST = async (...args: Parameters<typeof handler.POST>) => {
  await ensureAuthReady();
  return handler.POST(...args);
};
