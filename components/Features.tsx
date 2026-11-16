import Link from "next/link";

const features = [
  {
    icon: "🧠",
    title: "AI-анализ знаний",
    description:
      "Система оценивает уровень по каждой теме, выявляет сильные и слабые стороны.",
  },
  {
    icon: "📊",
    title: "Карта пробелов",
    description:
      "Наглядная визуализация того, что уже освоено, а что требует внимания.",
  },
  {
    icon: "🎯",
    title: "Персональный план",
    description:
      "Индивидуальная траектория обучения, которая меняется по мере прогресса.",
  },
  {
    icon: "📚",
    title: "Курсы и материалы",
    description:
      "Структурированные курсы с теорией, практикой и проверочными тестами.",
  },
  {
    icon: "🤖",
    title: "AI-наставник",
    description:
      "Отвечает на вопросы, объясняет сложные темы, помогает разобрать ошибки.",
  },
  {
    icon: "📈",
    title: "Аналитика прогресса",
    description:
      "Отслеживание результатов, статистика, рекомендации по развитию.",
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div id="how-it-works" className="mx-auto mb-14 max-w-2xl scroll-mt-24 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Тебе не нужно разбираться заранее</p>
          <h2 className="mt-3 text-3xl font-bold text-[var(--foreground)] md:text-4xl">
            На каждом шаге понятно, что делать дальше
          </h2>
          <p className="mt-4 text-lg leading-7 text-[var(--muted)]">
            Кнопки подписаны простыми словами, а результаты подскажут, куда двигаться дальше.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-[var(--border)] bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">{f.icon}</div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-14 rounded-3xl bg-slate-900 px-6 py-10 text-white md:flex md:items-center md:justify-between md:px-10">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-blue-300">Готов начать?</p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">Выбери тему — остальное подскажем</h2>
            <p className="mt-3 leading-7 text-slate-300">Можно сначала посмотреть курсы, а аккаунт создать тогда, когда захочешь записаться.</p>
          </div>
          <Link href="/courses" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:mt-0">
            Перейти в каталог курсов <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
