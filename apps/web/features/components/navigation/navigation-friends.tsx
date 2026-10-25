"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import UserAvatar from "@/features/components/user-avatar";
import { ActionTooltip } from "@/features/components/ui/action-tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/features/components/ui/popover";
import { FriendRequestActions } from "@/features/components/friends/friend-request-actions";
import { useSocket } from "@/features/components/providers/socket-provider";

export interface IncomingFriendRequest {
  id: string;
  name: string;
  imageUrl: string;
}

interface NavigationFriendsProps {
  profileId: string;
  incomingRequests: IncomingFriendRequest[];
}

export const NavigationFriends = ({
  profileId,
  incomingRequests,
}: NavigationFriendsProps) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { socket } = useSocket();

  const isActive = pathname?.startsWith("/friends");
  const pendingCount = incomingRequests.length;

  // Refresh the badge and list when someone sends, accepts,
  // declines, or removes a friend request involving this user.
  useEffect(() => {
    if (!socket) return;

    const key = `friends:${profileId}`;
    const onChange = () => router.refresh();

    socket.on(key, onChange);
    return () => {
      socket.off(key, onChange);
    };
  }, [socket, profileId, router]);

  const onOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      router.refresh();
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <ActionTooltip side="right" align="center" label="Friends">
        <PopoverTrigger className="group relative mx-3 flex items-center">
          {pendingCount > 0 && (
            <span className="absolute -bottom-1 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full border-[3px] border-[#E3E5E8] dark:border-[#1E1F22] bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
          <div
            className={cn(
              "flex h-12 w-12 rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden items-center justify-center bg-background dark:bg-neutral-700 group-hover:bg-indigo-500",
              isActive && "rounded-[16px] bg-indigo-500 dark:bg-indigo-500"
            )}
          >
            <Users
              size={25}
              className={cn(
                "transition text-indigo-500 group-hover:text-white",
                isActive && "text-white"
              )}
            />
          </div>
        </PopoverTrigger>
      </ActionTooltip>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={12}
        className="w-[min(20rem,calc(100vw-5rem))] p-0 gap-0 bg-white dark:bg-[#2B2D31]"
      >
        <PopoverTitle className="px-4 py-3 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
          Friend Requests
        </PopoverTitle>
        <div className="max-h-[400px] overflow-y-auto p-2">
          {pendingCount === 0 && (
            <p className="px-2 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No pending friend requests
            </p>
          )}
          {incomingRequests.map((request) => (
            <div
              key={request.id}
              className="flex items-center gap-x-3 rounded-md px-2 py-2"
            >
              <UserAvatar
                src={request.imageUrl}
                className="h-8 w-8 md:h-8 md:w-8"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-sm text-zinc-700 dark:text-zinc-200">
                  {request.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Wants to be friends
                </p>
              </div>
              <FriendRequestActions
                requestId={request.id}
                canAccept
                removeLabel="Decline"
              />
            </div>
          ))}
        </div>
        <Link
          href="/friends"
          onClick={() => setOpen(false)}
          className="block border-t border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm font-medium text-indigo-500 hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition"
        >
          View all friends →
        </Link>
      </PopoverContent>
    </Popover>
  );
};
