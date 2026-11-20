"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { deleteInvitation } from "@/lib/invitations/actions";

/** Two-step delete without a browser dialog: first click arms it, second confirms. */
export function DeleteButton({ id }: { id: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();

  if (!armed) {
    return (
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => setArmed(true)}
        aria-label="Delete invitation"
      >
        <Trash2 size={16} strokeWidth={1.5} />
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        className="btn btn-danger btn-sm"
        disabled={pending}
        onClick={() => start(() => deleteInvitation(id))}
      >
        {pending && <Spinner size={14} />}
        {pending ? "Deleting" : "Delete for good"}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setArmed(false)}>
        Keep
      </button>
    </span>
  );
}
