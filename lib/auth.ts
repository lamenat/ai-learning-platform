import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

/**
 * Возвращает текущего залогиненного пользователя или null.
 * Читает cookie `session` (userId), ищет в БД.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return user;
}