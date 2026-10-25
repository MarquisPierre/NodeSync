import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/prisma";

// Generates a new invite code for a server, which makes the previous invite link
// stop working. Only the server's owner can do this.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const { serverId } = await params;
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID Missing", { status: 400 });
    }

    // Matching on profileId limits this to servers the user owns.
    const server = await prisma.server.update({
      where: {
        id: serverId,
        profileId: profile.id,
      },
      data: {
        inviteCode: uuidv4(),
      },
    });

    // Returns the updated server so the invite modal can show the new link.
    return NextResponse.json(server);
  } catch (error) {
    console.log("[SERVER_ID_INVITE_CODE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
