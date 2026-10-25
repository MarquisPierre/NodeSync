import prisma from "@/lib/prisma";
import { FriendRequestStatus } from "@/server/generated/prisma/enums";

// Discord-style rule: you can DM someone if you're friends
// or if you share at least one server.
export const canDirectMessage = async (meId: string, otherId: string) => {
  if (meId === otherId) {
    return false;
  }

  const [friendship, sharedServer] = await Promise.all([
    prisma.friendRequest.findFirst({
      where: {
        status: FriendRequestStatus.ACCEPTED,
        OR: [
          { senderId: meId, receiverId: otherId },
          { senderId: otherId, receiverId: meId },
        ],
      },
      select: { id: true },
    }),
    prisma.server.findFirst({
      where: {
        AND: [
          { members: { some: { profileId: meId } } },
          { members: { some: { profileId: otherId } } },
        ],
      },
      select: { id: true },
    }),
  ]);

  return !!friendship || !!sharedServer;
};

// Always store the pair in the same order so each pair of people has exactly
// one conversation row (the @@unique in the schema enforces it).
const orderPair = (a: string, b: string): [string, string] =>
  a < b ? [a, b] : [b, a];

export const getOrCreateDirectConversation = async (
  meId: string,
  otherId: string
) => {
  const [profileOneId, profileTwoId] = orderPair(meId, otherId);

  return prisma.directConversation.upsert({
    where: {
      profileOneId_profileTwoId: { profileOneId, profileTwoId },
    },
    update: {},
    create: { profileOneId, profileTwoId },
    include: {
      profileOne: true,
      profileTwo: true,
    },
  });
};

// Mark the conversation read up to now for whichever side the profile is on.
export const markDirectConversationRead = async (
  conversationId: string,
  profileId: string
) => {
  const conversation = await prisma.directConversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ profileOneId: profileId }, { profileTwoId: profileId }],
    },
  });

  if (!conversation) {
    return null;
  }

  const now = new Date();

  return prisma.directConversation.update({
    where: { id: conversation.id },
    data:
      conversation.profileOneId === profileId
        ? { profileOneLastReadAt: now }
        : { profileTwoLastReadAt: now },
  });
};
