import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { verifyToken } from "@clerk/nextjs/server";

import prisma from "@/lib/prisma";
import { canJoinChat, chatRoom, userRoom } from "@/lib/socket-rooms";
import { NextApiResponseServerIo } from "@/types";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  if (!res.socket.server.io) {
    const path = "/api/socket/io";
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: path,
      // @ts-ignore
      addTrailingSlash: false,
    });

    // Only signed-in users may connect: the client sends its Clerk session
    // token, and we resolve it to a profile before accepting the socket.
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;

        if (typeof token !== "string" || !token) {
          return next(new Error("Unauthorized"));
        }

        const { sub: userId } = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });

        const profile = await prisma.profile.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (!profile) {
          return next(new Error("Unauthorized"));
        }

        socket.data.profileId = profile.id;
        next();
      } catch {
        next(new Error("Unauthorized"));
      }
    });

    io.on("connection", (socket) => {
      const profileId: string = socket.data.profileId;

      // Personal events (friend requests, new DMs) go to this room.
      socket.join(userRoom(profileId));

      socket.on("chat:join", async (chatId: unknown) => {
        if (typeof chatId !== "string") return;

        try {
          if (await canJoinChat(profileId, chatId)) {
            socket.join(chatRoom(chatId));
          }
        } catch (error) {
          console.log("[SOCKET_CHAT_JOIN]", error);
        }
      });

      socket.on("chat:leave", (chatId: unknown) => {
        if (typeof chatId !== "string") return;
        socket.leave(chatRoom(chatId));
      });
    });

    res.socket.server.io = io;
    globalThis.io = io;
  }

  res.end();
};

export default ioHandler;
