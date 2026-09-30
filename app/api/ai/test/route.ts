import { NextResponse } from "next/server";
import { ai, AI_MODEL } from "@/lib/ai";

export async function POST() {
  try {
    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: "Ты — дружелюбный AI-помощник образовательной платформы. Отвечай кратко.",
        },
        {
          role: "user",
          content: "Привет! Представься в одном предложении.",
        },
      ],
      max_tokens: 100,
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    const usage = completion.usage;

    return NextResponse.json({
      message: "AI работает!",
      reply,
      usage: {
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
      },
      model: AI_MODEL,
    });
  } catch (error) {
    console.error("=== Ошибка AI ===");
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