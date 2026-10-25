import { MemberRole } from "@/server/generated/prisma/client";
import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import  prisma  from "@/lib/prisma";

// Creates a channel in a server (?serverId=). Only admins and moderators can do this.
export async function POST(req: Request) {
  try {
    const profile = await currentProfile();
    const { name, type } = await req.json();
    const { searchParams } = new URL(req.url);

    const serverId = searchParams.get("serverId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // "general" is reserved for the default channel every server has.
    if (name === "general") {
      return new NextResponse("Name cannot be 'general'", { status: 400 });
    }

    // The update only matches if the user is an admin or moderator of this server,
    // so the role check and the insert happen in a single query.
    const server = await prisma.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: profile.id,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            },
          },
        },
      },
      data: {
        channels: {
          create: {
            profileId: profile.id,
            name,
            type,
          },
        },
      },
    });

    return NextResponse.json(server);
  } catch (error) {
    console.log("CHANNELS_POST", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}