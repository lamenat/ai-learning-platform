import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 min-w-9 items-center justify-center rounded-lg bg-[var(--accent)] px-1 text-[10px] font-bold text-white">
              ЧПТК
            </span>
            <span>Читинский политехнический колледж</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--muted)]">
            <Link href="/#how-it-works" className="hover:text-[var(--foreground)] transition">
              Как учиться
            </Link>
            <Link href="/courses" className="hover:text-[var(--foreground)] transition">
              Каталог курсов
            </Link>
            <Link href="/login" className="hover:text-[var(--foreground)] transition">
              Войти
            </Link>
          </nav>

          <div className="text-sm text-[var(--muted)]">
            © 2026 ГПОУ ЧПТК
          </div>
        </div>
      </div>
    </footer>
  );
}
