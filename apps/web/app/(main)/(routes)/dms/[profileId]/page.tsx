import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { currentProfile } from "@/lib/current-profile";
import {
  canDirectMessage,
  getOrCreateDirectConversation,
  markDirectConversationRead,
} from "@/lib/direct-conversation";
import { ChatInput } from "@/features/components/chat/chat-input";
import { DmHeader } from "@/features/components/dm/dm-header";
import { DmMessages } from "@/features/components/dm/dm-messages";
import { MediaRoom } from "@/features/components/media-room";

interface DmPageProps {
  params: Promise<{ profileId: string }>;
  searchParams: Promise<{ video?: string }>;
}

const DmPage = async ({ params, searchParams }: DmPageProps) => {
  const { profileId } = await params;
  const { video } = await searchParams;

  const profile = await currentProfile();

  if (!profile) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  const otherProfile = await prisma.profile.findUnique({
    where: { id: profileId },
  });

  // Unknown user, yourself, or someone you're not friends with and share no server with.
  if (!otherProfile || !(await canDirectMessage(profile.id, otherProfile.id))) {
    return redirect("/friends");
  }

  const conversation = await getOrCreateDirectConversation(
    profile.id,
    otherProfile.id
  );

  await markDirectConversationRead(conversation.id, profile.id);

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <DmHeader name={otherProfile.name} imageUrl={otherProfile.imageUrl} />
      {video ? (
        <MediaRoom chatId={conversation.id} video={true} audio={true} />
      ) : (
        <>
          <DmMessages
            name={otherProfile.name}
            conversationId={conversation.id}
            currentProfileId={profile.id}
          />
          <ChatInput
            name={otherProfile.name}
            type="conversation"
            apiUrl="/api/socket/private-messages"
            query={{ conversationId: conversation.id }}
          />
        </>
      )}
    </div>
  );
};

export default DmPage;
