"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { getMessagePreview } from "@/lib/message-preview";
import { useSocket } from "@/features/components/providers/socket-provider";
import UserAvatar from "@/features/components/user-avatar";
import { ActionTooltip } from "@/features/components/ui/action-tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/features/components/ui/popover";

export interface ConversationPreview {
  id: string;
  otherProfileId: string;
  otherName: string;
  otherImageUrl: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface IncomingDirectMessage {
  content: string;
  fileUrl: string | null;
  deleted: boolean;
  createdAt: string;
  profileId: string;
}

interface NavigationMessagesProps {
  profileId: string;
  conversations: ConversationPreview[];
}

const formatTime = (iso: string) => {
  const date = new Date(iso);
  const isToday = date.toDateString() === new Date().toDateString();

  return isToday
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const markRead = (conversationId: string) =>
  fetch(`/api/direct-conversations/${conversationId}/read`, {
    method: "POST",
  }).catch(() => {});

export const NavigationMessages = ({
  profileId,
  conversations: initialConversations,
}: NavigationMessagesProps) => {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState(initialConversations);
  const params = useParams();
  const router = useRouter();
  const { socket } = useSocket();

  // Server data wins whenever the layout re-renders (e.g. router.refresh()).
  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  const isOpenConversation = (conversation: ConversationPreview) =>
    params?.profileId === conversation.otherProfileId;

  const isOpenConversationRef = useRef(isOpenConversation);
  isOpenConversationRef.current = isOpenConversation;

  const conversationIds = initialConversations.map((c) => c.id).join(",");

  useEffect(() => {
    if (!socket || !conversationIds) {
      return;
    }

    const handlers = conversationIds.split(",").map((conversationId) => {
      const key = `chat:${conversationId}:messages`;

      const handler = (message: IncomingDirectMessage) => {
        if (message.profileId === profileId) {
          return;
        }

        setConversations((current) => {
          const conversation = current.find((c) => c.id === conversationId);

          if (!conversation) {
            return current;
          }

          const viewing = isOpenConversationRef.current(conversation);

          if (viewing) {
            markRead(conversationId);
          }

          const updated: ConversationPreview = {
            ...conversation,
            lastMessage: getMessagePreview(message),
            lastMessageAt: new Date(message.createdAt).toISOString(),
            unreadCount: viewing ? 0 : conversation.unreadCount + 1,
          };

          return [updated, ...current.filter((c) => c.id !== conversationId)];
        });
      };

      socket.on(key, handler);
      return { key, handler };
    });

    return () => {
      handlers.forEach(({ key, handler }) => socket.off(key, handler));
    };
  }, [socket, conversationIds, profileId]);

  // A message in a conversation this list doesn't know about yet (e.g. the
  // first message someone ever sends us) needs fresh data from the server.
  useEffect(() => {
    if (!socket) {
      return;
    }

    const key = `dms:${profileId}`;
    const onDirectMessage = ({ conversationId }: { conversationId: string }) => {
      if (!conversationIds.split(",").includes(conversationId)) {
        router.refresh();
      }
    };

    socket.on(key, onDirectMessage);
    return () => {
      socket.off(key, onDirectMessage);
    };
  }, [socket, profileId, conversationIds, router]);

  const unreadFor = (conversation: ConversationPreview) =>
    isOpenConversation(conversation) ? 0 : conversation.unreadCount;

  const totalUnread = conversations.reduce(
    (total, conversation) => total + unreadFor(conversation),
    0
  );

  const onOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    // Pick up conversations that started since the page loaded.
    if (nextOpen) {
      router.refresh();
    }
  };

  const onClick = (conversation: ConversationPreview) => {
    setOpen(false);
    setConversations((current) =>
      current.map((c) =>
        c.id === conversation.id ? { ...c, unreadCount: 0 } : c
      )
    );
    router.push(`/dms/${conversation.otherProfileId}`);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <ActionTooltip side="right" align="center" label="Direct messages">
        <PopoverTrigger className="group relative mx-3 flex items-center">
          {totalUnread > 0 && (
            <span className="absolute -bottom-1 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full border-[3px] border-[#E3E5E8] dark:border-[#1E1F22] bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
          <div className="flex h-12 w-12 rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden items-center justify-center bg-background dark:bg-neutral-700 group-hover:bg-indigo-500">
            <MessageCircle
              className="group-hover:text-white transition text-indigo-500"
              size={25}
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
          Direct Messages
        </PopoverTitle>
        <div className="max-h-[400px] overflow-y-auto p-2">
          {conversations.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No messages yet
            </p>
          )}
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onClick(conversation)}
              className={cn(
                "w-full flex items-center gap-x-3 rounded-md px-2 py-2 text-left transition hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50",
                params?.profileId === conversation.otherProfileId &&
                  "bg-zinc-700/20 dark:bg-zinc-700"
              )}
            >
              <UserAvatar
                src={conversation.otherImageUrl}
                className="h-8 w-8 md:h-8 md:w-8"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-x-2">
                  <p className="truncate font-semibold text-sm text-zinc-700 dark:text-zinc-200">
                    {conversation.otherName}
                  </p>
                  <span className="shrink-0 text-[11px] text-zinc-500 dark:text-zinc-400">
                    {formatTime(conversation.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-x-2">
                  <p
                    className={cn(
                      "truncate text-xs text-zinc-500 dark:text-zinc-400",
                      unreadFor(conversation) > 0 &&
                        "font-semibold text-zinc-800 dark:text-zinc-100"
                    )}
                  >
                    {conversation.lastMessage}
                  </p>
                  {unreadFor(conversation) > 0 && (
                    <span className="shrink-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
                      {unreadFor(conversation) > 99
                        ? "99+"
                        : unreadFor(conversation)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
