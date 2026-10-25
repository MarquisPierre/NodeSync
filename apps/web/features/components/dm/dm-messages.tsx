"use client";

import { Fragment, useRef } from "react";
import { format } from "date-fns";
import { Loader2, ServerCrash } from "lucide-react";

import type { PrivateMessage, Profile } from "@/server/generated/prisma/client";
import { useChatQuery } from "@/features/hooks/use-chat-query";
import { useChatSocket } from "@/features/hooks/use-chat-socket";
import { useChatScroll } from "@/features/hooks/use-chat-scroll";
import { ChatWelcome } from "@/features/components/chat/chat-welcome";
import { DmItem } from "@/features/components/dm/dm-item";

const DATE_FORMAT = "d MMM yyyy, HH:mm";

type PrivateMessageWithProfile = PrivateMessage & { profile: Profile };

interface DmMessagesProps {
  name: string;
  conversationId: string;
  currentProfileId: string;
}

export const DmMessages = ({
  name,
  conversationId,
  currentProfileId,
}: DmMessagesProps) => {
  const queryKey = `chat:${conversationId}`;
  const addKey = `chat:${conversationId}:messages`;
  const updateKey = `chat:${conversationId}:messages:update`;

  const socketUrl = "/api/socket/private-messages";
  const socketQuery = { conversationId };

  const chatRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useChatQuery({
      queryKey,
      apiUrl: "/api/private-messages",
      paramKey: "conversationId",
      paramValue: conversationId,
    });
  useChatSocket({ chatId: conversationId, queryKey, addKey, updateKey });
  useChatScroll({
    chatRef,
    bottomRef,
    loadMore: fetchNextPage,
    shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
    count: data?.pages?.[0]?.items?.length ?? 0,
  });

  if (status === "pending") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading messages...
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <ServerCrash className="h-7 w-7 text-zinc-500 my-4" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Something went wrong!
        </p>
      </div>
    );
  }

  return (
    <div ref={chatRef} className="flex-1 flex flex-col py-4 overflow-y-auto">
      {!hasNextPage && <div className="flex-1" />}
      {!hasNextPage && <ChatWelcome type="conversation" name={name} />}
      {hasNextPage && (
        <div className="flex justify-center">
          {isFetchingNextPage ? (
            <Loader2 className="h-6 w-6 text-zinc-500 animate-spin my-4" />
          ) : (
            <button
              onClick={() => fetchNextPage()}
              className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 text-xs my-4 dark:hover:text-zinc-300 transition"
            >
              Load previous messages
            </button>
          )}
        </div>
      )}
      <div className="flex flex-col-reverse mt-auto">
        {data?.pages?.map((group, i) => (
          <Fragment key={i}>
            {group.items.map((message: PrivateMessageWithProfile) => (
              <DmItem
                key={message.id}
                id={message.id}
                author={message.profile}
                currentProfileId={currentProfileId}
                content={message.content}
                fileUrl={message.fileUrl}
                deleted={message.deleted}
                timestamp={format(new Date(message.createdAt), DATE_FORMAT)}
                isUpdated={message.updatedAt !== message.createdAt}
                socketUrl={socketUrl}
                socketQuery={socketQuery}
              />
            ))}
          </Fragment>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
};
