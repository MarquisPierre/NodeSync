"use client";

import { useEffect, useState } from "react";

import { CreateServerModal } from "@/features/components/modals/create-server-modal";
import InviteModal from "@/features/components/modals/invite-modal";
import EditServerModal from "@/features/components/modals/edit-server-modal";
import MembersModal from "@/features/components/modals/members-modal";
import CreateChannelModal from "@/features/components/modals/create-channel-modal";
import LeaveServerModal from "@/features/components/modals/leave-server-modal";
import DeleteServerModal from "@/features/components/modals/delete-server-modal";
import DeleteChannelModal from "@/features/components/modals/delete-channel-modal";
import EditChannelModal from "@/features/components/modals/edit-channel-modal";
import { MessageFileModal } from "@/features/components/modals/message-file-modal";
import DeleteMessageModal from "@/features/components/modals/delete-message-modal";

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <CreateServerModal />
      <InviteModal />
      <EditServerModal />
      <MembersModal />
      <CreateChannelModal />
      <LeaveServerModal />
      <DeleteServerModal />
      <DeleteChannelModal />
      <EditChannelModal />
      <MessageFileModal />
      <DeleteMessageModal />
    </>
  );
};