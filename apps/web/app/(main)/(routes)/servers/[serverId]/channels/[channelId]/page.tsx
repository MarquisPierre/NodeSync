import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/prisma";
import { ChatHeader } from "@/features/components/chat/chat-header";
import { ChatInput } from "@/features/components/chat/chat-input";
import { ChatMessages } from "@/features/components/chat/chat-messages";
import { ChannelType } from "@/server/generated/prisma/enums";
import { MediaRoom } from "@/features/components/media-room";

interface ChannelIdPageProps {
  params: Promise<{
    serverId: string;
    channelId: string;
  }>;
}

// Channel page. Text channels show the message history and input, while voice
// and video channels open a LiveKit call room.
const ChannelIdPage = async ({ params }: ChannelIdPageProps) => {
  const { serverId, channelId } = await params;

  // Sends signed-out users to the sign-in page.
  const profile = await currentProfile();

  if (!profile) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  // Loads the channel being viewed.
  const channel = await prisma.channel.findUnique({
    where: {
      id: channelId,
    },
  });

  // The user's membership in this server, used for their role and permissions in the chat.
  const member = await prisma.member.findFirst({
    where: {
      serverId,
      profileId: profile.id,
    },
  });

  // The channel doesn't exist, or the user isn't a member of this server.
  if (!channel || !member) {
    return redirect("/");
  }

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader serverId={serverId} name={channel.name} type="channel" />
      {/* Text channels: message history and the message input. */}
      {channel.type === ChannelType.TEXT && (
        <>
          <ChatMessages
            member={member}
            name={channel.name}
            chatId={channel.id}
            type="channel"
            apiUrl="/api/messages"
            socketUrl="/api/socket/messages"
            socketQuery={{
              channelId: channel.id,
              serverId: channel.serverId,
            }}
            paramKey="channelId"
            paramValue={channel.id}
          />
          <ChatInput
            name={channel.name}
            type="channel"
            apiUrl="/api/socket/messages"
            query={{ channelId: channel.id, serverId }}
          />
        </>
      )}
      {/* Voice and video channels: a LiveKit call room. */}
      {channel.type === ChannelType.AUDIO && (
        <MediaRoom chatId={channel.id} video={false} audio={true} />
      )}
      {channel.type === ChannelType.VIDEO && (
        <MediaRoom chatId={channel.id} video={true} audio={true} />
      )}
    </div>
  );
};

export default ChannelIdPage;