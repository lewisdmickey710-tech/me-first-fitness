"use client";

import type { ButtonHTMLAttributes } from "react";
import { Button } from "@/components/ui";

type Variant = "primary" | "secondary" | "ghost" | "danger";

// A submit button that requires confirming a native dialog first, so a
// misclick on something destructive (cancelling a session, etc.) can't go
// through unnoticed. Must live in a form whose action is the thing being
// confirmed -- this only gates the click, the form still submits normally
// once confirmed.
export function ConfirmButton({
  confirmText,
  children,
  ...props
}: {
  confirmText: string;
  variant?: Variant;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      {...props}
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirmText)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </Button>
  );
}
