import prisma from "@/lib/prisma";

// Marks the conversation as read up to now for whichever side of it the profile is on.
export const markConversationRead = async (
  conversationId: string,
  profileId: string
) => {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [
        { memberOne: { profileId } },
        { memberTwo: { profileId } },
      ],
    },
    include: {
      memberOne: true,
    },
  });

  if (!conversation) {
    return null;
  }

  const now = new Date();
  const isMemberOne = conversation.memberOne.profileId === profileId;

  return prisma.conversation.update({
    where: { id: conversation.id },
    data: isMemberOne
      ? { memberOneLastReadAt: now }
      : { memberTwoLastReadAt: now },
  });
};
