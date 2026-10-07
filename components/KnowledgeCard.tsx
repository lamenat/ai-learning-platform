import Link from "next/link";

type Status = "strong" | "medium" | "gap";

const statusMeta: Record<Status, { label: string; emoji: string; bar: string }> = {
  strong: { label: "Сильная тема", emoji: "🟢", bar: "bg-green-500" },
  medium: { label: "Средний уровень", emoji: "🟡", bar: "bg-yellow-500" },
  gap: { label: "Пробел", emoji: "🔴", bar: "bg-red-500" },
};

type TestStat = {
  testId: string;
  testTitle: string;
  percent: number;
  status: Status;
};

export default function KnowledgeCard({
  courseId,
  courseTitle,
  percent,
  tests,
}: {
  courseId: string;
  courseTitle: string;
  percent: number;
  tests: TestStat[];
}) {
  const barColor =
    percent >= 80 ? "bg-green-500" : percent >= 60 ? "bg-yellow-500" : "bg-red-500";

  const strongCount = tests.filter((t) => t.status === "strong").length;
  const mediumCount = tests.filter((t) => t.status === "medium").length;
  const gapCount = tests.filter((t) => t.status === "gap").length;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <Link
          href={`/courses/${courseId}`}
          className="font-semibold text-lg text-[var(--foreground)] hover:text-[var(--accent)] transition"
        >
          {courseTitle}
        </Link>
        <span
          className={`text-2xl font-bold ${
            percent >= 80
              ? "text-green-600"
              : percent >= 60
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {percent}%
        </span>
      </div>

      <div className="mt-3 w-full h-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Мини-сводка */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        {strongCount > 0 && (
          <span className="rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-green-700">
            🟢 {strongCount}
          </span>
        )}
        {mediumCount > 0 && (
          <span className="rounded-full bg-yellow-50 border border-yellow-200 px-2.5 py-1 text-yellow-700">
            🟡 {mediumCount}
          </span>
        )}
        {gapCount > 0 && (
          <span className="rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-red-700">
            🔴 {gapCount}
          </span>
        )}
      </div>

      {/* Список тестов */}
      <ul className="mt-4 flex flex-col gap-1.5">
        {tests.map((t) => {
          const meta = statusMeta[t.status];
          return (
            <li
              key={t.testId}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="shrink-0">{meta.emoji}</span>
                <span className="text-[var(--foreground)] truncate">
                  {t.testTitle}
                </span>
              </span>
              <span
                className={`font-semibold shrink-0 ${
                  t.status === "strong"
                    ? "text-green-600"
                    : t.status === "medium"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {t.percent}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}