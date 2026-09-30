"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)] transition disabled:opacity-60"
    >
      {loading ? "Выходим…" : "Выйти"}
    </button>
  );
}