import { NavigationSidebar } from "@/features/components/navigation/navigation-sidebar";

// Layout for every signed-in page. Shows the navigation sidebar (servers,
// Friends, Messages) on the left and renders the current page beside it.
const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full">
      {/* Fixed navigation sidebar, hidden on small screens (opened from the header menu instead). */}
      <div className="hidden md:flex h-full w-[72px] z-30 flex-col fixed inset-y-0">
        <NavigationSidebar />
      </div>
      {/* Page content, offset so it isn't covered by the sidebar. */}
      <main className="md:pl-[72px] h-full">{children}</main>
    </div>
  );
};

export default MainLayout;