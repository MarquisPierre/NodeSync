import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/prisma";

interface InviteCodePageProps {
  params: Promise<{ inviteCode: string }>;
}

const InviteCodePage = async ({ params }: InviteCodePageProps) => {
  const { inviteCode } = await params;

  const profile = await currentProfile();

  if (!profile) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  if (!inviteCode) {
    return redirect("/");
  }

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

  const serverToJoin = await prisma.server.findFirst({
    where: { inviteCode },
  });

  if (!serverToJoin) {
    return redirect("/");
  }

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