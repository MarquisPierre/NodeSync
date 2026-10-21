import { redirect } from "next/navigation";

import { ModeToggle } from "@/features/components/ui/mode-toggle";
import { ScrollArea } from "@/features/components/ui/scroll-area";
import { Separator } from "@/features/components/ui/separator";
import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/prisma";
import { getMessagePreview } from "@/lib/message-preview";

import { NavigationAction } from "@/features/components/navigation/navigation-action";
import { NavigationItem } from "@/features/components/navigation/navigation-item";
import {
  NavigationMessages,
  type ConversationPreview,
} from "@/features/components/navigation/navigation-messages";
import { Show } from "@clerk/nextjs";
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

  const memberInclude = { include: { profile: true, server: true } };

  const rawConversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { memberOne: { profileId: profile.id } },
        { memberTwo: { profileId: profile.id } },
      ],
      directMessages: { some: {} },
    },
    include: {
      memberOne: memberInclude,
      memberTwo: memberInclude,
      directMessages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const unreadCounts = await Promise.all(
    rawConversations.map((conversation) => {
      const isMemberOne = conversation.memberOne.profileId === profile.id;
      const otherMember = isMemberOne
        ? conversation.memberTwo
        : conversation.memberOne;

      return prisma.directMessage.count({
        where: {
          conversationId: conversation.id,
          memberId: otherMember.id,
          deleted: false,
          createdAt: {
            gt: isMemberOne
              ? conversation.memberOneLastReadAt
              : conversation.memberTwoLastReadAt,
          },
        },
      });
    })
  );

  const conversations: ConversationPreview[] = rawConversations
    .flatMap((conversation, index) => {
      const { memberOne, memberTwo } = conversation;
      const otherMember =
        memberOne.profileId === profile.id ? memberTwo : memberOne;
      const last = conversation.directMessages[0];
      if (!last) return [];

      return [{
        id: conversation.id,
        serverId: otherMember.serverId,
        serverName: otherMember.server.name,
        otherMemberId: otherMember.id,
        otherName: otherMember.profile.name,
        otherImageUrl: otherMember.profile.imageUrl,
        lastMessage: getMessagePreview(last),
        lastMessageAt: last.createdAt.toISOString(),
        unreadCount: unreadCounts[index] ?? 0,
      }];
    })
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));

  return (
    <div className="space-y-4 flex flex-col items-center h-full text-primary w-full dark:bg-[#1E1F22] bg-[#E3E5E8] py-3">
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