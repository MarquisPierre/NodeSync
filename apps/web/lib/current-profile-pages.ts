import { getAuth } from "@clerk/nextjs/server";

import prisma from "@/lib/prisma";
import { NextApiRequest } from "next";

export const currentProfilePages = async (req: NextApiRequest) => {
  const { userId } = getAuth(req);

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