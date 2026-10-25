import { NextApiRequest } from "next";

import { currentProfilePages } from "@/lib/current-profile-pages";
import prisma from "@/lib/prisma";
import { chatRoom, userRoom } from "@/lib/socket-rooms";
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

    const io = res?.socket?.server?.io;

    // Everyone with this conversation open (both participants) gets the message.
    io?.to(chatRoom(conversationId)).emit(`chat:${conversationId}:messages`, message);

    // The recipient's Messages popup and unread badge listen on their user room,
    // which also covers brand-new conversations they haven't opened yet.
    const recipientId =
      conversation.profileOneId === profile.id
        ? conversation.profileTwoId
        : conversation.profileOneId;
    io?.to(userRoom(recipientId)).emit(`dms:${recipientId}`, {
      conversationId,
      message,
    });

    return res.status(200).json(message);
  } catch (error) {
    console.log("[PRIVATE_MESSAGES_POST]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
}
