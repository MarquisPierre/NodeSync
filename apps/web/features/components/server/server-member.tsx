"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { Check, ShieldAlert, ShieldCheck, UserPlus } from "lucide-react";
import { ActionTooltip } from "@/features/components/action-tooltip";

import { cn } from "@/lib/utils";
import { MemberRole } from "@/server/generated/prisma/enums";
import type { Member, Profile, Server } from "@/server/generated/prisma/client";
import UserAvatar from "@/features/components/user-avatar";

interface ServerMemberProps {
  member: Member & { profile: Profile };
  server: Server;
}

const roleIconMap = {
  [MemberRole.GUEST]: null,
  [MemberRole.MODERATOR]: (
    <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />
  ),
  [MemberRole.ADMIN]: <ShieldAlert className="h-4 w-4 ml-2 text-rose-500" />,
};

export const ServerMember = ({ member, server }: ServerMemberProps) => {
  const params = useParams();
  const router = useRouter();

  const icon = roleIconMap[member.role];

const [requestState, setRequestState] = useState<"idle" | "loading" | "sent">("idle");

const onAddFriend = async (e: React.MouseEvent) => {
  e.stopPropagation(); // don't also open the DM
  if (requestState !== "idle") return;

  try {
    setRequestState("loading");
    await axios.post("/api/friends", { profileId: member.profile.id });
    setRequestState("sent");
  } catch (error) {
    // 409 means already sent or already friends, which is still "done" for the user.
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      setRequestState("sent");
    } else {
      console.log(error);
      setRequestState("idle");
    }
  }
};


  const onClick = () => {
    router.push(`/dms/${member.profile.id}`);
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1",
        params?.profileId === member.profile.id && "bg-zinc-700/20 dark:bg-zinc-700"
      )}
    >
      <UserAvatar
        src={member.profile.imageUrl}
        className="h-8 w-8 md:h-8 md:w-8"
      />
      <p
        className={cn(
          "font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition",
          params?.profileId === member.profile.id &&
            "text-primary dark:text-zinc-200 dark:group-hover:text-white"
        )}
      >
        {member.profile.name}
      </p>
      {icon}
      <ActionTooltip label={requestState === "sent" ? "Request sent" : "Add friend"}>
  {requestState === "sent" ? (
    <Check className="ml-auto w-4 h-4 text-emerald-500" />
  ) : (
    <UserPlus
      onClick={onAddFriend}
      className="ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition md:opacity-0 md:group-hover:opacity-100"
    />
  )}
</ActionTooltip>

    </button>
  );
};