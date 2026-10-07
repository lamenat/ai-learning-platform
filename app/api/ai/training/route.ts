import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ai, AI_MODEL } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const count = Math.min(Math.max(Number(body?.count) || 3, 1), 5);

    // ===== 1. Находим пробелы студента =====
    const attempts = await prisma.testAttempt.findMany({
      where: {
        studentId: user.id,
        completedAt: { not: null },
      },
      include: {
        test: {
          include: {
            course: { select: { id: true, title: true } },
            questions: { select: { text: true } },
          },
        },
      },
    });

    // Группируем по тестам
    const byTestMap = new Map<
      string,
      {
        testId: string;
        testTitle: string;
        courseTitle: string;
        questions: string[];
        bestScore: number;
        maxScore: number;
      }
    >();

    for (const a of attempts) {
      const existing = byTestMap.get(a.testId);
      if (!existing) {
        byTestMap.set(a.testId, {
          testId: a.testId,
          testTitle: a.test.title,
          courseTitle: a.test.course.title,
          questions: a.test.questions.map((q) => q.text),
          bestScore: a.score,
          maxScore: a.maxScore,
        });
      } else {
        existing.bestScore = Math.max(existing.bestScore, a.score);
      }
    }

    // Фильтруем пробелы (percent < 60)
    const gaps = Array.from(byTestMap.values())
      .map((t) => ({
        ...t,
        percent: t.maxScore > 0 ? Math.round((t.bestScore / t.maxScore) * 100) : 0,
      }))
      .filter((t) => t.percent < 60)
      .sort((a, b) => a.percent - b.percent);

    // ===== 2. Определяем тему =====
    const weakTopic = body?.topic as string | undefined;

    let topic: string;
    let contextInfo = "";

    if (weakTopic && weakTopic.trim().length >= 3) {
      topic = weakTopic.trim();
      contextInfo = "по указанной пользователем теме";
    } else if (gaps.length > 0) {
      const weakest = gaps[0];
      topic = weakest.testTitle;
      contextInfo = `по теме твоего пробела (тест "${weakest.testTitle}" — результат ${weakest.percent}%)`;
    } else {
      topic = "общие знания";
      contextInfo = "общие вопросы для тренировки";
    }

    // ===== 3. Формируем prompt =====
    const prompt = `Ты — AI-методист. Сгенерируй ${count} тренировочных вопроса ${contextInfo}.

Тема: "${topic}"
${gaps[0]?.questions.length ? `\nВопросы из исходного теста (для контекста):\n${gaps[0].questions.slice(0, 5).map((q, i) => `${i + 1}. ${q}`).join("\n")}` : ""}

**Требования:**
- 4 варианта ответа, ровно 1 правильный
- Вопросы на русском языке
- Понятные студенту
- Не повторяйся

Верни ТОЛЬКО JSON-массив:
[
  {
    "text": "Текст вопроса",
    "answers": [
      { "text": "Вариант 1", "isCorrect": false },
      { "text": "Вариант 2", "isCorrect": true },
      { "text": "Вариант 3", "isCorrect": false },
      { "text": "Вариант 4", "isCorrect": false }
    ]
  }
]`;

    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: "Ты возвращаешь только валидный JSON без markdown-обёрток.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.8,
    });

    let raw = completion.choices[0]?.message?.content ?? "";
    raw = raw.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("Не удалось распарсить:", raw);
      return NextResponse.json(
        { error: "AI вернул некорректный формат. Попробуйте ещё раз." },
        { status: 502 }
      );
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json(
        { error: "AI вернул не массив" },
        { status: 502 }
      );
    }

    const questions = parsed.filter(
      (q): q is { text: string; answers: { text: string; isCorrect: boolean }[] } =>
        typeof q === "object" &&
        q !== null &&
        typeof (q as { text?: unknown }).text === "string" &&
        Array.isArray((q as { answers?: unknown }).answers)
    );

    return NextResponse.json({
      topic,
      contextInfo,
      gapsCount: gaps.length,
      questions,
    });
  } catch (error) {
    console.error("=== Ошибка POST /api/ai/training ===");
    console.error(error);
    return NextResponse.json(
      {
        error: "AI не ответил",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}