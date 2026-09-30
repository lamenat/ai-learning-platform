import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ message: "Вы вышли" });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0, // удаляем cookie
  });
  return res;
}