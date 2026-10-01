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
    if (!body) {
      return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    }

    const { questionId, givenAnswerId } = body as {
      questionId?: string;
      givenAnswerId?: string;
    };

    if (!questionId) {
      return NextResponse.json({ error: "Не указан questionId" }, { status: 400 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        answers: true,
        test: { select: { title: true } },
      },
    });

    if (!question) {
      return NextResponse.json({ error: "Вопрос не найден" }, { status: 404 });
    }

    const given = givenAnswerId
      ? question.answers.find((a) => a.id === givenAnswerId)
      : null;
    const correct = question.answers.find((a) => a.isCorrect);

    const prompt = `Ты — AI-наставник образовательной платформы. Объясни студенту, почему он ошибся в тесте.

**Вопрос:** ${question.text}

**Ответ студента:** ${given ? given.text : "не отвечено"}

**Правильный ответ:** ${correct ? correct.text : "не указан"}

Объясни кратко и дружелюбно:
1. Почему ответ студента неправильный
2. Почему правильный ответ — именно этот
3. Дай короткую подсказку, как запомнить тему

Пиши не длиннее 150 слов. Не используй заголовки, только текст абзацами.`;

    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Ты — дружелюбный AI-наставник образовательной платформы. Объясняй понятно, без сложных терминов.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const explanation = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({
      explanation,
      question: question.text,
      given: given?.text ?? null,
      correct: correct?.text ?? null,
    });
  } catch (error) {
    console.error("=== Ошибка POST /api/ai/explain ===");
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