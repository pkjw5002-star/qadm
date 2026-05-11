import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";

export type SessionData = {
  userId?: string;
};

const sessionOptions = {
  cookieName: "qadm_session",
  password: process.env.SESSION_PASSWORD as string,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  if (!sessionOptions.password || sessionOptions.password.length < 32) {
    throw new Error(
      "SESSION_PASSWORD must be set and at least 32 characters long."
    );
  }
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

