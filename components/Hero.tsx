import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-1.5 text-sm text-[var(--muted)]">
          <span className="flex h-2 w-2 rounded-full bg-[var(--accent)]"></span>
          Обучение с искусственным интеллектом
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl md:text-6xl font-bold tracking-tight text-[var(--foreground)]">
          Персональное обучение,{" "}
          <span className="text-[var(--accent)]">адаптированное под тебя</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--muted)]">
          Платформа анализирует твои знания, находит пробелы и строит
          индивидуальный план обучения. AI объясняет сложные темы, генерирует
          задания и отслеживает прогресс.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto rounded-lg bg-[var(--accent)] px-8 py-3 text-base font-medium text-white hover:bg-[var(--accent-hover)] transition"
          >
            Начать бесплатно
          </Link>
          <Link
            href="#features"
            className="w-full sm:w-auto rounded-lg border border-[var(--border)] bg-white px-8 py-3 text-base font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition"
          >
            Узнать больше
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          <Stat value="AI" label="Анализ знаний" />
          <Stat value="24/7" label="Доступ к материалам" />
          <Stat value="∞" label="Адаптивные задания" />
          <Stat value="100%" label="Персонализация" />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4">
      <div className="text-2xl font-bold text-[var(--accent)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--muted)]">{label}</div>
    </div>
  );
}