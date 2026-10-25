import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// Rejects uploads from signed-out users.
const handleAuth = async () => {
  const { userId } = await auth();
  if (!userId) throw new UploadThingError("Unauthorized");
  return { userId };
};

// The upload types the app accepts. Each one checks authentication first.
export const ourFileRouter = {
  // Server icons and message attachments: up to 10 images or a single PDF, 4MB each.
  serverImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 10 } ,
    pdf: { maxFileSize: "4MB", maxFileCount: 1 } })
       .middleware(() => handleAuth())
       .onUploadComplete(() => {}),
  // A single image or PDF attached to a message.
  messageFile: f(["image", "pdf"])
       .middleware(() => handleAuth())
       .onUploadComplete(() => {}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;