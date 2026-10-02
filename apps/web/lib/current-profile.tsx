import { auth } from "@clerk/nextjs/server";

import prisma  from "@/lib/prisma";

export const currentProfile = async () => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const profile = await prisma.profile.findFirst({
    where: {
      userId,
    },
  });

  return profile;
};