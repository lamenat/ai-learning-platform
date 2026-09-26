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
    <section id="features" className="py-24 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">
            Всё для эффективного обучения
          </h2>
          <p className="mt-4 text-lg text-[var(--muted)]">
            Платформа объединяет курсы, тестирование и AI-анализ в единую систему
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:shadow-lg hover:border-[var(--accent)] transition"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}