import { MobileSheet } from "@/features/components/mobile-sheet";
import { NavigationSidebar } from "@/features/components/navigation/navigation-sidebar";
import { ServerSidebar } from "@/features/components/server/server-sidebar";

export const MobileToggle = ({ serverId }: { serverId: string }) => {
  return (
    <MobileSheet>
      <div className="w-[72px] shrink-0">
        <NavigationSidebar />
      </div>
      <div className="w-60 min-w-0">
        <ServerSidebar serverId={serverId} />
      </div>
    </MobileSheet>
  );
};
