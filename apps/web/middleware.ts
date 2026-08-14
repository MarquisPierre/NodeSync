import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // 🚀 THIS LOG WILL SHOW IN YOUR TERMINAL ON EVERY PAGE REFRESH
  console.log("Middleware caught a request to:", req.nextUrl.pathname);

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.[\\w]+$).*)',
    '/(api|trpc)(.*)',
  ],
};

