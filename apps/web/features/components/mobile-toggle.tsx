import { Menu } from "lucide-react";

import { Button } from "@/features/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/features/components/ui/sheet";
import { NavigationSidebar } from "@/features/components/navigation/navigation-sidebar";
import { ServerSidebar } from "@/features/components/server/server-sidebar";

export const MobileToggle = ({ serverId }: { serverId: string }) => {
  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" />}
      >
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 flex gap-0">
        <div className="w-[72px]">
          <NavigationSidebar />
        </div>
        <ServerSidebar serverId={serverId} />
      </SheetContent>
    </Sheet>
  );
};