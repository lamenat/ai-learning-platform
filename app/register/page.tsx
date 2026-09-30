"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import Input from "@/components/Input";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");
    setSuccess(false);

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fields) {
          setErrors(data.fields);
        }
        setServerError(data.error || "Что-то пошло не так");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      console.error(err);
      setServerError("Не удалось связаться с сервером");
    } finally {
      setLoading(false);
    }
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
      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 text-center">
          ✅ Аккаунт создан! Перенаправляем на страницу входа…
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
            {loading ? "Создаём аккаунт…" : "Создать аккаунт"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}