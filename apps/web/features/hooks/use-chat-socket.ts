import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { Member, Message, Profile } from "@/server/generated/prisma/client";
import { useSocket } from "@/features/components/providers/socket-provider";

type ChatSocketProps = {
  chatId: string;
  addKey: string;
  updateKey: string;
  queryKey: string;
};

type MessageWithMemberWithProfile = Message & {
  member: Member & {
    profile: Profile;
  };
};

export const useChatSocket = ({
  chatId,
  addKey,
  updateKey,
  queryKey,
}: ChatSocketProps) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // The server only sends this chat's events to sockets in its room, and only
  // lets you in if you belong to the channel's server or the DM.
  useEffect(() => {
    if (!socket) {
      return;
    }

    const join = () => socket.emit("chat:join", chatId);

    if (socket.connected) {
      join();
    }
    // Rooms are lost on reconnect, so join again every time we connect.
    socket.on("connect", join);

    return () => {
      socket.off("connect", join);
      socket.emit("chat:leave", chatId);
    };
  }, [socket, chatId]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on(updateKey, (message: MessageWithMemberWithProfile) => {
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return oldData;
        }

        const newData = oldData.pages.map((page: any) => {
          return {
            ...page,
            items: page.items.map((item: MessageWithMemberWithProfile) => {
              if (item.id === message.id) {
                return message;
              }
              return item;
            }),
          };
        });

        return {
          ...oldData,
          pages: newData,
        };
      });
    });

    socket.on(addKey, (message: MessageWithMemberWithProfile) => {
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return {
            pages: [
              {
                items: [message],
              },
            ],
          };
        }

        const newData = [...oldData.pages];

        newData[0] = {
          ...newData[0],
          items: [message, ...newData[0].items],
        };

        return {
          ...oldData,
          pages: newData,
        };
      });
    });

    return () => {
      socket.off(addKey);
      socket.off(updateKey);
    };
  }, [socket, queryClient, addKey, queryKey, updateKey]);
};