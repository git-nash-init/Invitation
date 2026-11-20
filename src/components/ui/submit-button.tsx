"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes } from "react";
import { Button } from "@/components/ui/button";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  variant?: "primary" | "glass" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  /** Words shown while the form is being sent. Defaults to the normal label. */
  pendingText?: React.ReactNode;
};

/** A submit button that shows a spinner and stops double-clicks while its form's action is running. */
export function SubmitButton({ children, pendingText, disabled, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} disabled={disabled} {...props}>
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
