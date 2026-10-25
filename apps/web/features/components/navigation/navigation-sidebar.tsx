import { redirect } from "next/navigation";
import { Show } from "@clerk/nextjs";

import { ModeToggle } from "@/features/components/ui/mode-toggle";
import { ScrollArea } from "@/features/components/ui/scroll-area";
import { Separator } from "@/features/components/ui/separator";
import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/prisma";
import { getMessagePreview } from "@/lib/message-preview";
import { FriendRequestStatus } from "@/server/generated/prisma/enums";

import { NavigationAction } from "@/features/components/navigation/navigation-action";
import { NavigationItem } from "@/features/components/navigation/navigation-item";
import { NavigationFriends } from "@/features/components/navigation/navigation-friends";
import {
  NavigationMessages,
  type ConversationPreview,
} from "@/features/components/navigation/navigation-messages";
import { NavigationUserButton } from "@/features/components/navigation/navigation-user-button";

export const NavigationSidebar = async () => {
  const profile = await currentProfile();

  if (!profile) {
    return redirect("/");
  }

  const servers = await prisma.server.findMany({
    where: {
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
  });

  const rawConversations = await prisma.directConversation.findMany({
    where: {
      OR: [{ profileOneId: profile.id }, { profileTwoId: profile.id }],
      messages: { some: {} },
    },
    include: {
      profileOne: true,
      profileTwo: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const unreadCounts = await Promise.all(
    rawConversations.map((conversation) => {
      const isProfileOne = conversation.profileOneId === profile.id;

      return prisma.privateMessage.count({
        where: {
          conversationId: conversation.id,
          profileId: isProfileOne
            ? conversation.profileTwoId
            : conversation.profileOneId,
          deleted: false,
          createdAt: {
            gt: isProfileOne
              ? conversation.profileOneLastReadAt
              : conversation.profileTwoLastReadAt,
          },
        },
      });
    })
  );

  const conversations: ConversationPreview[] = rawConversations
    .flatMap((conversation, index) => {
      const other =
        conversation.profileOneId === profile.id
          ? conversation.profileTwo
          : conversation.profileOne;
      const last = conversation.messages[0];
      if (!last) return [];

      return [
        {
          id: conversation.id,
          otherProfileId: other.id,
          otherName: other.name,
          otherImageUrl: other.imageUrl,
          lastMessage: getMessagePreview(last),
          lastMessageAt: last.createdAt.toISOString(),
          unreadCount: unreadCounts[index] ?? 0,
        },
      ];
    })
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));

  const pendingFriendRequests = await prisma.friendRequest.count({
    where: {
      receiverId: profile.id,
      status: FriendRequestStatus.PENDING,
    },
  });

  return (
    <div className="space-y-4 flex flex-col items-center h-full text-primary w-full dark:bg-[#1E1F22] bg-[#E3E5E8] py-3">
      <NavigationFriends
        pendingCount={pendingFriendRequests}
        profileId={profile.id}
      />
      <NavigationMessages
        profileId={profile.id}
        conversations={conversations}
      />
      <NavigationAction />
      <Separator className="h-[2px] bg-zinc-300 dark:bg-zinc-700 rounded-md w-10 mx-auto" />
      <ScrollArea className="flex-1 w-full">
        {servers.map((server) => (
          <div key={server.id} className="mb-4">
            <NavigationItem
              id={server.id}
              name={server.name}
              imageUrl={server.imageUrl}
            />
          </div>
        ))}
      </ScrollArea>
      <div className="pb-3 mt-auto flex items-center flex-col gap-y-4">
        <ModeToggle />
        <Show when="signed-in">
          <NavigationUserButton />
        </Show>
      </div>
    </div>
  );
};
