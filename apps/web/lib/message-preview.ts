interface PreviewableMessage {
  content: string;
  fileUrl: string | null;
  deleted: boolean;
}

export const getMessagePreview = (message: PreviewableMessage) => {
  if (message.deleted) {
    return "Message deleted";
  }

  if (!message.content && message.fileUrl) {
    return "Sent an attachment";
  }

  return message.content;
};
