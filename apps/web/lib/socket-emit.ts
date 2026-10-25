import type { Server as SocketIOServer } from "socket.io";

import { userRoom } from "@/lib/socket-rooms";

declare global {
  // eslint-disable-next-line no-var
  var io: SocketIOServer | undefined;
}

// Sends an event only to one user's sockets. Works from App Router routes too.
// Does nothing until the socket server has started (the first client
// connecting to /api/socket/io starts it).
export const emitToUser = (
  profileId: string,
  key: string,
  payload?: unknown
) => {
  globalThis.io?.to(userRoom(profileId)).emit(key, payload);
};
