"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import Input from "@/components/Input";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const next: typeof errors = {};

    if (!name.trim()) next.name = "Введите имя";
    else if (name.trim().length < 2) next.name = "Минимум 2 символа";

    if (!email.trim()) next.email = "Введите email";
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Некорректный email";

    if (!password) next.password = "Введите пароль";
    else if (password.length < 6) next.password = "Минимум 6 символов";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    // TODO: подключить реальную регистрацию (Auth.js + Prisma)
    console.log("register:", { name, email, password, role });
    setSubmitted(true);
  }

  return (
    <AuthLayout
      title="Создать аккаунт"
      subtitle="Начни обучение с персональным AI-планом"
      footer={
        <>
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline font-medium">
            Войти
          </Link>
        </>
      }
    >
      {submitted ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 text-center">
          ✅ Проверка прошла! Логика регистрации будет добавлена на следующем шаге.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            id="name"
            label="Имя"
            type="text"
            placeholder="Как к тебе обращаться?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            autoComplete="name"
          />

          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            id="password"
            label="Пароль"
            type="password"
            placeholder="Минимум 6 символов"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="new-password"
          />

          {/* Выбор роли */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Я регистрируюсь как
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  role === "student"
                    ? "border-[var(--accent)] bg-blue-50 text-[var(--accent)]"
                    : "border-[var(--border)] bg-white text-[var(--muted)] hover:border-[var(--accent)]"
                }`}
              >
                🎓 Студент
              </button>
              <button
                type="button"
                onClick={() => setRole("teacher")}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  role === "teacher"
                    ? "border-[var(--accent)] bg-blue-50 text-[var(--accent)]"
                    : "border-[var(--border)] bg-white text-[var(--muted)] hover:border-[var(--accent)]"
                }`}
              >
                👨‍🏫 Преподаватель
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
          >
            Создать аккаунт
          </button>
        </form>
      )}
    </AuthLayout>
  );
}