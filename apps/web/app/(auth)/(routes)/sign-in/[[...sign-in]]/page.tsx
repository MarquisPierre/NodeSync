import { SignIn } from '@clerk/nextjs'

// Sign-in page. Renders Clerk's sign-in form; the catch-all route lets Clerk
// handle its own steps (such as verification) under /sign-in.
export default function Page() {
  return <SignIn />
}
