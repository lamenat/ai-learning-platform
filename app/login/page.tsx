"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import Input from "@/components/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const next: { email?: string; password?: string } = {};

    if (!email.trim()) {
      next.email = "Введите email";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      next.email = "Некорректный email";
    }

    if (!password) {
      next.password = "Введите пароль";
    } else if (password.length < 6) {
      next.password = "Минимум 6 символов";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    // TODO: подключить реальную авторизацию (Auth.js)
    console.log("login:", { email, password });
    setSubmitted(true);
  }

  return (
    <AuthLayout
      title="Вход в аккаунт"
      subtitle="Войдите, чтобы продолжить обучение"
      footer={
        <>
          Нет аккаунта?{" "}
          <Link href="/register" className="text-[var(--accent)] hover:underline font-medium">
            Зарегистрироваться
          </Link>
        </>
      }
    >
      {submitted ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 text-center">
          ✅ Проверка прошла! Логика авторизации будет добавлена на следующем шаге.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-[var(--muted)]">
              <input type="checkbox" className="accent-[var(--accent)]" />
              Запомнить меня
            </label>
            <Link href="#" className="text-[var(--accent)] hover:underline">
              Забыли пароль?
            </Link>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
          >
            Войти
          </button>
        </form>
      )}
    </AuthLayout>
  );
}