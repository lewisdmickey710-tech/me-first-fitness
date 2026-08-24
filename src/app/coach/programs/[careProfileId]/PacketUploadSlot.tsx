"use client";

import { useRef, useState, useTransition } from "react";
import { uploadCareProfilePacket } from "@/app/coach/programs/actions";
import type { CareProfilePacket } from "@/lib/types";

export function PacketUploadSlot({
  careProfileId,
  phase,
  uploaded,
}: {
  careProfileId: string;
  phase: CareProfilePacket["phase"];
  uploaded: boolean;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function submitFile(file: File) {
    if (file.type !== "application/pdf") {
      setError("PDFs only.");
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.set("packet", file);
    startTransition(async () => {
      try {
        await uploadCareProfilePacket(careProfileId, phase, formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      }
    });
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) submitFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-3 text-center transition-colors ${
        isDragOver
          ? "border-pink bg-pink/10"
          : uploaded
            ? "border-rose/40 bg-rose/5"
            : "border-grayLt bg-white"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) submitFile(file);
          e.target.value = "";
        }}
      />
      <p className="text-sm font-medium text-ink">Phase {phase}</p>
      <p className="mt-1 text-xs text-gray">
        {isPending
          ? "Uploading…"
          : uploaded
            ? "Uploaded — drop to replace"
            : "Drag a PDF here, or click"}
      </p>
      {error ? <p className="mt-1 text-xs text-pink">{error}</p> : null}
    </div>
  );
}
