import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { initialProfile } from "@/lib/initial-profile";
import { InitialModal } from "@/features/components/modals/initial-modal";
// import CreateServerModal from "@/components/modals/create-server-modal";
// import { InitialModal } from "@/components/modals/initial-modal";

const SetupPage = async () => {

  const profile = await initialProfile();

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

  return <InitialModal />;
};

export default SetupPage;