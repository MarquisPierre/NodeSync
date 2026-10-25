"use client";

import { useState } from "react";
import axios from "axios";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { ActionTooltip } from "@/features/components/action-tooltip";
import { Button } from "@/features/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/components/ui/dialog";

interface FriendRequestActionsProps {
  requestId: string;
  canAccept?: boolean;
  removeLabel: string; // "Decline", "Cancel", or "Remove friend"
  // When set, the remove button asks for confirmation first (used for unfriending).
  confirmName?: string;
}

export const FriendRequestActions = ({
  requestId,
  canAccept,
  removeLabel,
  confirmName,
}: FriendRequestActionsProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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

  const remove = () => run(() => axios.delete(`/api/friends/${requestId}`));

  const onRemoveClick = () => {
    if (confirmName) {
      setIsConfirmOpen(true);
    } else {
      remove();
    }
  };

  const onConfirm = async () => {
    await remove();
    setIsConfirmOpen(false);
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
          onClick={onRemoveClick}
          className="rounded-full bg-zinc-200 dark:bg-zinc-700 p-2 text-rose-500 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </ActionTooltip>

      {confirmName && (
        <Dialog
          open={isConfirmOpen}
          onOpenChange={(open) => !isLoading && setIsConfirmOpen(open)}
        >
          <DialogContent className="bg-white text-black p-0 overflow-hidden">
            <DialogHeader className="pt-8 px-6">
              <DialogTitle className="text-2xl text-center font-bold">
                Remove Friend
              </DialogTitle>
              <DialogDescription className="text-center text-zinc-500">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-indigo-500">
                  {confirmName}
                </span>{" "}
                from your friends?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mx-0 mb-0 bg-gray-100 px-6 py-3">
              <div className="flex items-center justify-between w-full">
                <Button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setIsConfirmOpen(false)}
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={isLoading}
                  onClick={onConfirm}
                  variant="primary"
                >
                  Remove
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
