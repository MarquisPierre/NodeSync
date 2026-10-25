import { NextApiRequest } from "next";

import { currentProfilePages } from "@/lib/current-profile-pages";
import prisma from "@/lib/prisma";
import { NextApiResponseServerIo } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "DELETE" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const profile = await currentProfilePages(req);
    const { messageId, conversationId } = req.query;
    const { content } = req.body ?? {};

    if (!profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (typeof messageId !== "string" || typeof conversationId !== "string") {
      return res
        .status(400)
        .json({ error: "Message or conversation ID missing" });
    }

    // Only the author can edit or delete. There are no admins in DMs.
    const existing = await prisma.privateMessage.findFirst({
      where: {
        id: messageId,
        conversationId,
        profileId: profile.id,
        deleted: false,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Message not found" });
    }

    let message;

    if (req.method === "DELETE") {
      message = await prisma.privateMessage.update({
        where: { id: messageId },
        data: {
          fileUrl: null,
          content: "This message has been deleted.",
          deleted: true,
        },
        include: { profile: true },
      });
    } else {
      if (!content) {
        return res.status(400).json({ error: "Content missing" });
      }

      message = await prisma.privateMessage.update({
        where: { id: messageId },
        data: { content },
        include: { profile: true },
      });
    }

    // Same update key your chat already listens for.
    res?.socket?.server?.io?.emit(
      `chat:${conversationId}:messages:update`,
      message
    );

    return res.status(200).json(message);
  } catch (error) {
    console.log("[PRIVATE_MESSAGE_ID]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
}
