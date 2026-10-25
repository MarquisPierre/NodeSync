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

// Direct message page between the signed-in user and another user. Available to
// friends and to users who share a server; shows a video call when ?video is set.
const DmPage = async ({ params, searchParams }: DmPageProps) => {
  const { profileId } = await params;
  const { video } = await searchParams;

  // Sends signed-out users to the sign-in page.
  const profile = await currentProfile();

  if (!profile) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  // The user being messaged.
  const otherProfile = await prisma.profile.findUnique({
    where: { id: profileId },
  });

  // Redirects if the user doesn't exist, is the current user, or is neither a
  // friend nor a member of a shared server.
  if (!otherProfile || !(await canDirectMessage(profile.id, otherProfile.id))) {
    return redirect("/friends");
  }

  // Each pair of users has exactly one conversation; creates it on the first visit.
  const conversation = await getOrCreateDirectConversation(
    profile.id,
    otherProfile.id
  );

  // Opening the conversation clears its unread count.
  await markDirectConversationRead(conversation.id, profile.id);

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <DmHeader name={otherProfile.name} imageUrl={otherProfile.imageUrl} />
      {/* Shows the video call while ?video is set, otherwise the chat. */}
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
