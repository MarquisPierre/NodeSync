import { currentUser, auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const initialProfile = async () => {
  const user = await currentUser();

  if (!user) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }


  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  if (profile) {
    return profile;
  }

const email = user.emailAddresses.find(
  (e) => e.id === user.primaryEmailAddressId
)?.emailAddress;


if (!email) {
  throw new Error("User has no primary email address");
}
  const newProfile = await prisma.profile.create({
    data: {
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      imageUrl: user.imageUrl,
      email: email,
    },
  });

  return newProfile;
};