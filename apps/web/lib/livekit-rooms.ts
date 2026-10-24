import { RoomServiceClient, TrackSource } from "livekit-server-sdk";

export type RoomStatus = {
  isLive: boolean;
  participants: { identity: string; name: string }[];
};

// Room names are channel ids, so this returns a map of channelId -> status
// for every room that currently has people in it.
export const getRoomStatuses = async (
  roomNames: string[]
): Promise<Record<string, RoomStatus>> => {
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!url || !apiKey || !apiSecret || roomNames.length === 0) {
    return {};
  }

  const client = new RoomServiceClient(url, apiKey, apiSecret);

  try {
    // Only returns rooms that are active right now.
    const activeRooms = await client.listRooms(roomNames);

    const entries = await Promise.all(
      activeRooms
        .filter((room) => room.numParticipants > 0)
        .map(async (room) => {
          const participants = await client.listParticipants(room.name);

          const status: RoomStatus = {
            isLive: participants.some((p) =>
              p.tracks.some((t) => t.source === TrackSource.SCREEN_SHARE)
            ),
            participants: participants.map((p) => ({
              identity: p.identity,
              name: p.name,
            })),
          };

          return [room.name, status] as const;
        })
    );

    return Object.fromEntries(entries);
  } catch (error) {
    // If LiveKit is unreachable, the sidebar should still render.
    console.log("[LIVEKIT_ROOM_STATUS]", error);
    return {};
  }
};
