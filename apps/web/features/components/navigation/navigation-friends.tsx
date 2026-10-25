"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { ActionTooltip } from "@/features/components/ui/action-tooltip";
import { useSocket } from "@/features/components/providers/socket-provider";

interface NavigationFriendsProps {
  pendingCount: number;
  profileId: string;
}

export const NavigationFriends = ({
  pendingCount,
  profileId,
}: NavigationFriendsProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { socket } = useSocket();

  const isActive = pathname?.startsWith("/friends");

  // Refresh the badge and Friends page when someone sends, accepts,
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

  return (
    <ActionTooltip side="right" align="center" label="Friends">
      <Link href="/friends" className="group relative mx-3 flex items-center">
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
      </Link>
    </ActionTooltip>
  );
};
