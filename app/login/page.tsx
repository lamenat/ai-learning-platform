"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import Input from "@/components/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Введите email";
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Некорректный email";
    if (!password) next.password = "Введите пароль";
    else if (password.length < 6) next.password = "Минимум 6 символов";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Ошибка входа");
        return;
      }

      // Успех — редирект на dashboard
      router.push("/dashboard");
      router.refresh(); // обновить состояние серверных компонентов
    } catch (err) {
      console.error(err);
      setServerError("Не удалось связаться с сервером");
    } finally {
      setLoading(false);
    }
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

        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Входим…" : "Войти"}
        </button>
      </form>
    </AuthLayout>
  );
}