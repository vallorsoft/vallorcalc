"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteCalcButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await fetch(`/api/calculations/${id}`, { method: "DELETE" });
    router.push("/calculations");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button onClick={handleDelete} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700">Törlés megerősítése</button>
        <button onClick={() => setConfirming(false)} className="btn-secondary text-sm">Mégse</button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="border border-red-300 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50 transition">
      Törlés
    </button>
  );
}
