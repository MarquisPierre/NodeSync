// proxy.ts (Next.js 16+) — use middleware.ts on Next.js 15 or earlier
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/uploadthing", // carried over from your old publicRoutes
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.[\\w]+$).*)",
    "/(api|trpc)(.*)",
  ],
};