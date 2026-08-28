## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | SSR + API routes in one codebase |
| UI | shadcn/ui + Tailwind | Owned components, no CSS fights |
| Auth | Clerk | Don't roll your own auth |
| ORM | Prisma | Type-safe queries, tracked migrations |
| Database | MySQL (TiDB Cloud) | Relational data (servers→channels→messages) |
| Real-time | Socket.io | Persistent connections for instant messaging |
| File storage | UploadThing | Offloaded object storage, not on-server files |
| Hosting | Vercel + Railway | Serverless frontend, persistent socket server |
