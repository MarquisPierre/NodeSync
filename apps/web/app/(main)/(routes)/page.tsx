'use client'
import { Button } from "@workspace/ui/components/button"
import { useClerk } from '@clerk/nextjs'

export default function Page() {
    const { signOut } = useClerk()
  return (
    // Clicking this button signs out a user
    // and redirects them to the home page "/".
    <div className="flex flex-wrap items-center gap-2 md:flex-row">
    <Button  onClick={() => signOut({ redirectUrl: '/' })}>Sign out</Button>
    </div>
  )
}
