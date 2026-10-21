"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";

// Clerk can finish loading before hydration, so the UserButton would render on the
// client but not on the server. Wait until after mount to keep the two in sync.
export const NavigationUserButton = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-[48px] w-[48px] rounded-full bg-zinc-300 dark:bg-zinc-700" />;
  }

  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "h-[48px] w-[48px]",
        },
      }}
    />
  );
};
