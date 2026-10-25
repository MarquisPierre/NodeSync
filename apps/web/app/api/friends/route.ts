import { NextResponse } from "next/server";
import { emitSocketEvent } from "@/lib/socket-emit";
import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/prisma";
import { FriendRequestStatus } from "@/server/generated/prisma/enums";

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { profileId } = await req.json();

    if (!profileId || typeof profileId !== "string") {
      return new NextResponse("Profile ID missing", { status: 400 });
    }

    if (profileId === profile.id) {
      return new NextResponse("You can't add yourself", { status: 400 });
    }

    const receiver = await prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!receiver) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Look for a request in either direction between the two people.
    const existing = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: profile.id, receiverId: profileId },
          { senderId: profileId, receiverId: profile.id },
        ],
      },
    });

    if (existing) {
      if (existing.status === FriendRequestStatus.ACCEPTED) {
        return new NextResponse("Already friends", { status: 409 });
      }

      if (existing.senderId === profile.id) {
        return new NextResponse("Friend request already sent", { status: 409 });
      }

      // They already sent us a request, so sending one back accepts it.
      const accepted = await prisma.friendRequest.update({
        where: { id: existing.id },
        data: { status: FriendRequestStatus.ACCEPTED },
      });
        emitSocketEvent(`friends:${existing.senderId}`);

      return NextResponse.json(accepted);
    }

    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: profile.id,
        receiverId: profileId,
      },
    });
     emitSocketEvent(`friends:${profileId}`);

    return NextResponse.json(friendRequest, { status: 201 });
  } catch (error) {
    console.log("[FRIENDS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
