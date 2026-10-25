import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");

  if (!room) {
    return NextResponse.json(
      { error: 'Missing "room" query parameter' },
      { status: 400 }
    );
  }

  const profile = await currentProfile();

  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  // A room is a channel (caller must be in its server), a server conversation,
  // or a direct conversation (caller must be one of its two participants).
  const [channel, conversation, directConversation] = await Promise.all([
    prisma.channel.findFirst({
      where: {
        id: room,
        server: { members: { some: { profileId: profile.id } } },
      },
      select: { id: true },
    }),
    prisma.conversation.findFirst({
      where: {
        id: room,
        OR: [
          { memberOne: { profileId: profile.id } },
          { memberTwo: { profileId: profile.id } },
        ],
      },
      select: { id: true },
    }),
    prisma.directConversation.findFirst({
      where: {
        id: room,
        OR: [{ profileOneId: profile.id }, { profileTwoId: profile.id }],
      },
      select: { id: true },
    }),
  ]);

  if (!channel && !conversation && !directConversation) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Identity must be unique per participant, so use the profile id rather than
  // the display name; the name is still shown in the call.
  const at = new AccessToken(apiKey, apiSecret, {
    identity: profile.id,
    name: profile.name,
  });

  at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

  return NextResponse.json({ token: await at.toJwt() });
}
