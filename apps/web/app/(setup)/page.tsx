import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { initialProfile } from "@/lib/initial-profile";
import CreateServerModal from "@/features/components/modals/create-server-modal";
import { InitialModal } from "@/features/components/modals/initial-modal";



// Home page ("/"). Sends users to their first server, or asks them to create one
// if they don't belong to any server yet.
const SetupPage = async () => {
  // Loads the user's profile, creating it on their first sign-in.
  const profile = await initialProfile();

  // Finds any server the user is a member of.
  const server = await prisma.server.findFirst({
    where: {
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
  });

  if (server) {
    return redirect(`/servers/${server.id}`);
  }

  // New users see the "create your first server" modal.
  return <InitialModal />;
};

export default SetupPage;