import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white text-sm font-bold">
              AI
            </span>
            <span>Learning Platform</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--muted)]">
            <Link href="#features" className="hover:text-[var(--foreground)] transition">
              Возможности
            </Link>
            <Link href="#courses" className="hover:text-[var(--foreground)] transition">
              Курсы
            </Link>
            <Link href="/login" className="hover:text-[var(--foreground)] transition">
              Войти
            </Link>
          </nav>

          <div className="text-sm text-[var(--muted)]">
            © 2026 AI Learning Platform
          </div>
        </div>
      </div>
    </footer>
  );
}