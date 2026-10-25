import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/prisma";
import { Message } from "@/server/generated/prisma/client";

// Number of messages loaded per page.
const MESSAGES_BATCH = 10;

// Loads a channel's messages, newest first, 10 at a time. Passing ?cursor=
// (the last message ID from the previous page) loads the next older page.
// Only members of the channel's server can read them.
export async function GET(req: Request) {
  try {
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor");
    const channelId = searchParams.get("channelId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!channelId) {
      return new NextResponse("Channel ID missing", { status: 400 });
    }

    // Only members of the channel's server can read its messages.
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        server: { members: { some: { profileId: profile.id } } },
      },
      select: { id: true },
    });

    if (!channel) {
      return new NextResponse("Channel not found", { status: 404 });
    }

    let messages: Message[] = [];

    if (cursor) {
      messages = await prisma.message.findMany({
        take: MESSAGES_BATCH,
        skip: 1,
        cursor: {
          id: cursor,
        },
        where: {
          channelId,
        },
        include: {
          member: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      messages = await prisma.message.findMany({
        take: MESSAGES_BATCH,
        where: {
          channelId,
        },
        include: {
          member: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    // A full page means there may be older messages, so the last ID becomes the next cursor.
    let nextCursor = null;

    if (messages.length === MESSAGES_BATCH) {
      nextCursor = messages[MESSAGES_BATCH - 1]?.id ?? null;
    }

    return NextResponse.json({ items: messages, nextCursor });
  } catch (error) {
    console.log("[MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}