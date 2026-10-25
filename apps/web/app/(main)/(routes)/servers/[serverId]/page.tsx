import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/prisma";

interface ServerIdPageProps {
  params: Promise<{
    serverId: string;
  }>;
}

// Opening a server without choosing a channel redirects to its #general channel.
const ServerIdPage = async ({ params }: ServerIdPageProps) => {
  const { serverId } = await params;

  // Sends signed-out users to the sign-in page.
  const profile = await currentProfile();

  if (!profile) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  // Finds the server's #general channel, but only if the user is a member.
  const server = await prisma.server.findUnique({
    where: {
      id: serverId,
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
    include: {
      channels: {
        where: {
          name: "general",
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  const initialChannel = server?.channels[0];

  // Not a member, or the server has no #general channel.
  if (initialChannel?.name !== "general") {
    return redirect("/");;
  }

  return redirect(`/servers/${serverId}/channels/${initialChannel?.id}`);
};

export default ServerIdPage;