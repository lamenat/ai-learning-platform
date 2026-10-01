import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ai, AI_MODEL } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
    }
    if (user.role !== "teacher") {
      return NextResponse.json(
        { error: "Генерировать вопросы могут только преподаватели" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    }

    const { topic, count } = body as { topic?: string; count?: number };

    if (!topic || topic.trim().length < 3) {
      return NextResponse.json(
        { error: "Укажите тему (минимум 3 символа)" },
        { status: 400 }
      );
    }

    const n = Math.min(Math.max(Number(count) || 3, 1), 5);

    const prompt = `Ты — эксперт-методист. Сгенерируй ${n} тестовых вопроса по теме: "${topic}".

Требования:
- Каждый вопрос имеет ровно 4 варианта ответа
- Ровно один вариант правильный
- Вопросы на русском, понятные студенту
- Не повторяйся

Верни ТОЛЬКО JSON-массив без пояснений, в формате:
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
          content:
            "Ты возвращаешь только валидный JSON без markdown-обёрток и без пояснений.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.8,
    });

    let raw = completion.choices[0]?.message?.content ?? "";

    // Чистим от возможных markdown-обёрток ```json ... ```
    raw = raw.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("Не удалось распарсить ответ AI:", raw);
      return NextResponse.json(
        { error: "AI вернул некорректный формат. Попробуйте ещё раз." },
        { status: 502 }
      );
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json(
        { error: "AI вернул не массив вопросов" },
        { status: 502 }
      );
    }

    // Валидируем структуру
    const questions = parsed.filter(
      (q): q is { text: string; answers: { text: string; isCorrect: boolean }[] } =>
        typeof q === "object" &&
        q !== null &&
        typeof (q as { text?: unknown }).text === "string" &&
        Array.isArray((q as { answers?: unknown }).answers)
    );

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("=== Ошибка POST /api/ai/generate-questions ===");
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