"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function LessonChat({
  lessonId,
  lessonTitle,
}: {
  lessonId: string;
  lessonTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Автоскролл вниз при новом сообщении
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Фокус на поле ввода при открытии
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setError("");
    setInput("");

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          lessonId,
          history: messages, // без текущего сообщения — оно идёт отдельно
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Не удалось получить ответ");
        // Возвращаем сообщение обратно в input, чтобы не потерять
        setInput(text);
        setMessages(messages);
        return;
      }

      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Ошибка сети");
      setInput(text);
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Плавающая кнопка */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-[var(--accent-hover)] transition"
        >
          💬 Спросить AI
        </button>
      )}

      {/* Модалка чата */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col h-[85vh] sm:h-[600px]">
            {/* Заголовок */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[var(--foreground)] truncate">
                  💬 AI-наставник
                </h3>
                <p className="text-xs text-[var(--muted)] truncate">
                  {lessonTitle}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {messages.length > 0 && (
                  <button
                    onClick={() => {
                      setMessages([]);
                      setError("");
                    }}
                    className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition"
                  >
                    Очистить
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-[var(--muted)] hover:text-[var(--foreground)] text-xl leading-none px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* История сообщений */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
              {messages.length === 0 && (
                <div className="text-center text-sm text-[var(--muted)] mt-8">
                  <div className="text-3xl mb-2">🤖</div>
                  <p>Привет! Я AI-наставник этого урока.</p>
                  <p className="mt-1">Спроси меня о чём угодно — я помогу разобраться.</p>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line leading-relaxed ${
                      m.role === "user"
                        ? "bg-[var(--accent)] text-white rounded-br-sm"
                        : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] rounded-bl-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-[var(--muted)]">
                    🤖 AI печатает...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Ошибки */}
            {error && (
              <div className="px-5 py-2 border-t border-[var(--border)]">
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              </div>
            )}

            {/* Поле ввода */}
            <div className="px-5 py-4 border-t border-[var(--border)] flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Задай вопрос… (Enter — отправить)"
                rows={2}
                disabled={loading}
                className="flex-1 resize-none rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "…" : "→"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}