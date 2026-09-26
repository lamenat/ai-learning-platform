import Link from "next/link";
import { ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface)]">
      {/* Шапка с лого */}
      <header className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white text-sm font-bold">
              AI
            </span>
            <span>Learning Platform</span>
          </Link>
        </div>
      </header>

      {/* Контент — карточка по центру */}
      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                {title}
              </h1>
              <p className="mt-2 text-sm text-[var(--muted)]">{subtitle}</p>
            </div>

            {children}
          </div>

          <div className="mt-6 text-center text-sm text-[var(--muted)]">
            {footer}
          </div>
        </div>
      </main>
    </div>
  );
}