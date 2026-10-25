import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/prisma";
import { ServerSidebar } from "@/features/components/server/server-sidebar";

// Layout for everything inside a server. Confirms the user is a member of the
// server, then shows its channel and member sidebar next to the current page.
const ServerIdLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ serverId: string }>;
}) => {
  const { serverId } = await params;

  // Sends signed-out users to the sign-in page.
  const profile = await currentProfile();

  if (!profile) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  // Loads the server only if the current user is one of its members.
  const server = await prisma.server.findUnique({
    where: {
      id: serverId,
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
  });

  // Not a member, or the server doesn't exist.
  if (!server) {
    return redirect("/");
  }

  return (
   <div className="h-full">
    {/* Channel and member sidebar, hidden on small screens. */}
    <div className="hidden md:flex h-full w-60 z-20 flex-col fixed inset-y-0">
      <ServerSidebar serverId={serverId} />
    </div>
    <main className="h-full md:pl-60">{children}</main>
  </div>
  );
};

export default ServerIdLayout;