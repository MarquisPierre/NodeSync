import { NextApiRequest } from "next";

import { currentProfilePages } from "@/lib/current-profile-pages";
import prisma from "@/lib/prisma";
import { NextApiResponseServerIo } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const profile = await currentProfilePages(req);
    const { content, fileUrl } = req.body;
    const { conversationId } = req.query;

    if (!profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!conversationId || typeof conversationId !== "string") {
      return res.status(400).json({ error: "Conversation ID missing" });
    }

    if (!content) {
      return res.status(400).json({ error: "Content missing" });
    }

    const conversation = await prisma.directConversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ profileOneId: profile.id }, { profileTwoId: profile.id }],
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const message = await prisma.privateMessage.create({
      data: {
        content,
        fileUrl,
        conversationId,
        profileId: profile.id,
      },
      include: { profile: true },
    });

    // Same key pattern as your other chats, so useChatSocket picks it up.
    res?.socket?.server?.io?.emit(`chat:${conversationId}:messages`, message);

    // Also notify the recipient directly, so a brand-new conversation shows up
    // in their Messages popup even though they aren't listening to it yet.
    const recipientId =
      conversation.profileOneId === profile.id
        ? conversation.profileTwoId
        : conversation.profileOneId;
    res?.socket?.server?.io?.emit(`dms:${recipientId}`, { conversationId });

    return res.status(200).json(message);
  } catch (error) {
    console.log("[PRIVATE_MESSAGES_POST]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
}
