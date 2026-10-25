import { SignUp } from '@clerk/nextjs'

// Sign-up page. Renders Clerk's sign-up form; the catch-all route lets Clerk
// handle its own steps (such as email verification) under /sign-up.
export default function Page() {
  return <SignUp />
}