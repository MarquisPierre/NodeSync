<div align="center">

# 💬 NodeSync

A full-stack real-time chat application inspired by Discord — built to explore
WebSocket architecture, relational data modeling, and production-grade auth.

[![Live Demo](https://img.shields.io/badge/demo-live-5865F2?style=for-the-badge)](https://your-demo-link.vercel.app)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)

</div>

<br>

<div align="center">
 
</div>

<br>

## ✨ Features

- 🔐 **Authentication** — sign up, sign in, session management via Clerk
- 💬 **Real-time messaging** — instant send/receive with typing indicators & presence
- 🗂️ **Servers & channels** — create, join, and manage text channels
- 🧑‍🤝‍🧑 **Direct messages** — 1:1 conversations outside of servers
- 📎 **File uploads** — image and file attachments in messages
- 🔒 **Role-based permissions** — owner / admin / member access control

## 🛠️ Tech Stack

| Layer | Tech | Why |
|---|---|---|
| Framework | **Next.js** (App Router) | SSR + API routes in one codebase |
| UI | **shadcn/ui** + Tailwind | Owned components, no CSS fights |
| Auth | **Clerk** | Production-grade auth without rolling your own |
| ORM | **Prisma** | Type-safe queries, tracked migrations |
| Database | **MySQL** (TiDB Cloud) | Relational fit for servers → channels → messages |
| Real-time | **Socket.io** | Persistent connections for instant messaging |
| File storage | **UploadThing** | Offloaded object storage, not on-server files |
| Hosting | **Vercel** + **Railway** | Serverless frontend, persistent socket server |

## 🏗️ Architecture

<div align="center">
  <img src="architecture.svg" alt="Architecture diagram" width="700">
</div>



## 📝 What I Learned

- Managing WebSocket connections separately from serverless HTTP infrastructure
- Modeling many-to-many relationships (users ↔ servers) with a join table
- Handling optimistic UI updates for a snappier real-time feel

## 📄 License

MIT

</div>
