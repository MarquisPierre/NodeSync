"use client";

import { useState } from "react";
import axios from "axios";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { ActionTooltip } from "@/features/components/action-tooltip";

interface FriendRequestActionsProps {
  requestId: string;
  canAccept?: boolean;
  removeLabel: string; // "Decline", "Cancel", or "Remove friend"
}

export const FriendRequestActions = ({
  requestId,
  canAccept,
  removeLabel,
}: FriendRequestActionsProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const run = async (action: () => Promise<unknown>) => {
    try {
      setIsLoading(true);
      await action();
      router.refresh(); // re-runs the page and the sidebar badge
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ml-auto flex items-center gap-x-2">
      {canAccept && (
        <ActionTooltip label="Accept">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => run(() => axios.patch(`/api/friends/${requestId}`))}
            className="rounded-full bg-zinc-200 dark:bg-zinc-700 p-2 text-emerald-500 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
          </button>
        </ActionTooltip>
      )}
      <ActionTooltip label={removeLabel}>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => run(() => axios.delete(`/api/friends/${requestId}`))}
          className="rounded-full bg-zinc-200 dark:bg-zinc-700 p-2 text-rose-500 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </ActionTooltip>
    </div>
  );
};
