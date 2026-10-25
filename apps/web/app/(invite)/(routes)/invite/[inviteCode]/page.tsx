import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/prisma";

interface InviteCodePageProps {
  params: Promise<{ inviteCode: string }>;
}

// Invite link page (/invite/<code>). Adds the signed-in user to the server that
// owns the invite code, then opens that server.
const InviteCodePage = async ({ params }: InviteCodePageProps) => {
  const { inviteCode } = await params;

  // Sends signed-out users to the sign-in page.
  const profile = await currentProfile();

  if (!profile) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  if (!inviteCode) {
    return redirect("/");
  }

  // Users who are already members go straight to the server.
  const existingServer = await prisma.server.findFirst({
    where: {
      inviteCode,
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
  });

  if (existingServer) {
    return redirect(`/servers/${existingServer.id}`);
  }

  // Looks up the server for this invite code; an invalid code returns to the home page.
  const serverToJoin = await prisma.server.findFirst({
    where: { inviteCode },
  });

  if (!serverToJoin) {
    return redirect("/");
  }

  // Adds the user as a new member (Guest role by default).
  const server = await prisma.server.update({
    where: { id: serverToJoin.id },
    data: {
      members: {
        create: [{ profileId: profile.id }],
      },
    },
  });

  return redirect(`/servers/${server.id}`);
};

export default InviteCodePage;