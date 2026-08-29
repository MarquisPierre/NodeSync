'use client'
import { UserButton } from '@clerk/nextjs'
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function Page() {
    // const { signOut } = useClerk()
  return (
    // Clicking this button signs out a user. Last update.
    // and redirects them to the home page "/".
    <div className= "fixed top-4 left-4">
      <UserButton />
       <ThemeToggle />
    </div>
  )
}
