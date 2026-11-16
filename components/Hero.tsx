import Link from "next/link";

const steps = [
  { number: "01", title: "Выбери курс", text: "Открой каталог и найди тему, которую хочешь изучить.", icon: "📚" },
  { number: "02", title: "Запишись и учись", text: "Внутри курса открывай уроки и проходи короткие тесты.", icon: "✍️" },
  { number: "03", title: "Следи за прогрессом", text: "Посмотри, что уже получается и какую тему повторить.", icon: "🌱" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--surface)]">
      <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-24">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-blue-700">
            <span aria-hidden="true">✨</span> Учиться можно в своём темпе
          </div>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-[var(--foreground)] md:text-6xl">
            Разберись в новой теме <span className="text-[var(--accent)]">шаг за шагом</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Выбери курс, изучай уроки и проверяй себя. Если станет сложно — AI-помощник объяснит тему простыми словами.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/courses" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[var(--accent-hover)]">
              Смотреть курсы <span aria-hidden="true">→</span>
            </Link>
            <Link href="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-blue-300 hover:text-[var(--accent)]">
              Создать аккаунт
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">Первый шаг простой: выбери курс, который тебе интересен.</p>
        </div>

        <div className="rounded-3xl border border-white bg-white/90 p-5 shadow-xl shadow-blue-900/5 md:p-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Твой маршрут</p>
              <h2 className="mt-1 text-xl font-bold">Как здесь учиться</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">3 шага</span>
          </div>
          <ol className="mt-2 divide-y divide-slate-100">
            {steps.map((step) => (
              <li key={step.number} className="flex gap-4 py-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl" aria-hidden="true">{step.icon}</span>
                <div>
                  <p className="text-xs font-semibold tracking-wide text-blue-600">ШАГ {step.number}</p>
                  <h3 className="mt-1 font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/courses" className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">
            Перейти к первому шагу <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
