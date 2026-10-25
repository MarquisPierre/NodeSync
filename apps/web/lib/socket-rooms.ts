import prisma from "@/lib/prisma";

// Every socket joins its own user room on connect, and joins a chat room
// only after canJoinChat confirms it's allowed in.
export const userRoom = (profileId: string) => `user:${profileId}`;
export const chatRoom = (chatId: string) => `chat:${chatId}`;

// A chat is either a channel (you must be a member of its server)
// or a direct conversation (you must be one of its two participants).
export const canJoinChat = async (profileId: string, chatId: string) => {
  const [channel, directConversation] = await Promise.all([
    prisma.channel.findFirst({
      where: {
        id: chatId,
        server: { members: { some: { profileId } } },
      },
      select: { id: true },
    }),
    prisma.directConversation.findFirst({
      where: {
        id: chatId,
        OR: [{ profileOneId: profileId }, { profileTwoId: profileId }],
      },
      select: { id: true },
    }),
  ]);

  return !!channel || !!directConversation;
};
