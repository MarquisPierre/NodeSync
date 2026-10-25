import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/prisma";
import { emitToUser } from "@/lib/socket-emit";
import { FriendRequestStatus } from "@/server/generated/prisma/enums";

type RouteContext = { params: Promise<{ requestId: string }> };

// Accept a pending request. Only the person who received it can accept.
export async function PATCH(_req: Request, { params }: RouteContext) {
  try {
    const { requestId } = await params;
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        receiverId: profile.id,
        status: FriendRequestStatus.PENDING,
      },
    });

    if (!friendRequest) {
      return new NextResponse("Request not found", { status: 404 });
    }

    const accepted = await prisma.friendRequest.update({
      where: { id: friendRequest.id },
      data: { status: FriendRequestStatus.ACCEPTED },
    });

    // Let the sender know their request was accepted.
    emitToUser(friendRequest.senderId, `friends:${friendRequest.senderId}`);

    return NextResponse.json(accepted);
  } catch (error) {
    console.log("[FRIEND_REQUEST_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Decline (receiver), cancel (sender), or unfriend (either side).
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { requestId } = await params;
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only the sender or receiver can remove it.
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        OR: [{ senderId: profile.id }, { receiverId: profile.id }],
      },
    });

    if (!friendRequest) {
      return new NextResponse("Request not found", { status: 404 });
    }

    await prisma.friendRequest.delete({ where: { id: friendRequest.id } });

    // Let the other person know so their list and badge update.
    const otherId =
      friendRequest.senderId === profile.id
        ? friendRequest.receiverId
        : friendRequest.senderId;
    emitToUser(otherId, `friends:${otherId}`);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.log("[FRIEND_REQUEST_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
