import UserAvatar from "@/features/components/user-avatar";
import { SocketIndicator } from "@/features/components/socket-indicator";
import { ChatVideoButton } from "@/features/components/chat/chat-video-button";
import { MobileSheet } from "@/features/components/mobile-sheet";
import { NavigationSidebar } from "@/features/components/navigation/navigation-sidebar";

interface DmHeaderProps {
  name: string;
  imageUrl: string;
}

export const DmHeader = ({ name, imageUrl }: DmHeaderProps) => {
  return (
    <div className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2">
      {/* DMs have no server sidebar, so the mobile drawer only holds the nav bar. */}
      <MobileSheet>
        <div className="w-[72px] shrink-0">
          <NavigationSidebar />
        </div>
      </MobileSheet>
      <UserAvatar src={imageUrl} className="h-8 w-8 md:h-8 md:w-8 mr-2" />
      <p className="truncate font-semibold text-md text-black dark:text-white">
        {name}
      </p>
      <div className="ml-auto flex shrink-0 items-center pl-2">
        <ChatVideoButton />
        <SocketIndicator />
      </div>
    </div>
  );
};
