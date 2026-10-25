import type { Server as SocketIOServer } from "socket.io";

declare global {
  // eslint-disable-next-line no-var
  var io: SocketIOServer | undefined;
}

// Works from App Router routes too. Does nothing until the socket server has
// started (the first client connecting to /api/socket/io starts it).
export const emitSocketEvent = (key: string, payload?: unknown) => {
  globalThis.io?.emit(key, payload);
};
