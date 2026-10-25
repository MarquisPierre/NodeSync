import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/prisma";

// Number of messages loaded per page.
const MESSAGES_BATCH = 10;

// Loads a DM conversation's messages, newest first, 10 at a time. Passing ?cursor=
// (the last message ID from the previous page) loads the next older page.
export async function GET(req: Request) {
  try {
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor");
    const conversationId = searchParams.get("conversationId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!conversationId) {
      return new NextResponse("Conversation ID missing", { status: 400 });
    }

    // Only the two participants in the conversation can read it.
    const conversation = await prisma.directConversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ profileOneId: profile.id }, { profileTwoId: profile.id }],
      },
      select: { id: true },
    });

    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    const messages = await prisma.privateMessage.findMany({
      take: MESSAGES_BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where: { conversationId },
      include: { profile: true },
      orderBy: { createdAt: "desc" },
    });

    const nextCursor =
      messages.length === MESSAGES_BATCH
        ? messages[messages.length - 1]?.id ?? null
        : null;

    return NextResponse.json({ items: messages, nextCursor });
  } catch (error) {
    console.log("[PRIVATE_MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
