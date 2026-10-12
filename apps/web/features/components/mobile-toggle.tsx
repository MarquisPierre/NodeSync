import { Menu } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/features/components/ui/sheet";
import { Button } from "@/features/components/ui/button";
import { NavigationSidebar } from "@/features/components/navigation/navigation-sidebar";
import { ServerSidebar } from "@/features/components/server/server-sidebar";

export const MobileToggle = ({ serverId }: { serverId: string }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
        </Button>
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