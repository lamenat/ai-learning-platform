import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white text-sm font-bold">
            AI
          </span>
          <span>Learning Platform</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-[var(--muted)]">
          <Link href="#features" className="hover:text-[var(--foreground)] transition">
            Возможности
          </Link>
          <Link href="#courses" className="hover:text-[var(--foreground)] transition">
            Курсы
          </Link>
          <Link href="#about" className="hover:text-[var(--foreground)] transition">
            О платформе
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
          >
            Начать учиться
          </Link>
        </div>
      </nav>
    </header>
  );
}