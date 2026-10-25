"use client";

import * as z from "zod";
import axios from "axios";
import qs from "query-string";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, FileIcon, Trash } from "lucide-react";

import type { Profile } from "@/server/generated/prisma/client";
import { cn } from "@/lib/utils";
import UserAvatar from "@/features/components/user-avatar";
import { ActionTooltip } from "@/features/components/ui/action-tooltip";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/features/components/ui/form";
import { Input } from "@/features/components/ui/input";
import { Button } from "@/features/components/ui/button";
import { useModal } from "@/features/hooks/use-modal-store";

interface DmItemProps {
  id: string;
  content: string;
  author: Profile;
  currentProfileId: string;
  timestamp: string;
  fileUrl: string | null;
  deleted: boolean;
  isUpdated: boolean;
  socketUrl: string;
  socketQuery: Record<string, string>;
}

const formSchema = z.object({
  content: z.string().min(1),
});

export const DmItem = ({
  id,
  content,
  author,
  currentProfileId,
  timestamp,
  fileUrl,
  deleted,
  isUpdated,
  socketUrl,
  socketQuery,
}: DmItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { onOpen } = useModal();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsEditing(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { content },
  });

  useEffect(() => {
    form.reset({ content });
  }, [content, form]);

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: `${socketUrl}/${id}`,
        query: socketQuery,
      });

      await axios.patch(url, values);

      form.reset();
      setIsEditing(false);
    } catch (error) {
      console.log(error);
    }
  };

  const fileType = fileUrl?.split(".").pop();
  const isPDF = fileType === "pdf" && fileUrl;
  const isImage = !isPDF && fileUrl;

  // In DMs there are no admins: only the author can edit or delete.
  const isOwner = author.id === currentProfileId;
  const canDeleteMessage = !deleted && isOwner;
  const canEditMessage = !deleted && isOwner && !fileUrl;

  return (
    <div className="relative group flex items-center hover:bg-black/5 p-4 transition w-full">
      <div className="flex gap-x-2 items-start w-full">
        <UserAvatar src={author.imageUrl} />
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-x-2">
            <p className="font-semibold text-sm">{author.name}</p>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {timestamp}
            </span>
          </div>
          {isImage && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded-md mt-2 overflow-hidden border flex items-center bg-secondary h-40 w-40 sm:h-48 sm:w-48"
            >
              <Image
                src={fileUrl}
                alt={content}
                fill
                sizes="192px"
                className="object-cover"
              />
            </a>
          )}
          {isPDF && (
            <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
              <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
              >
                PDF File
              </a>
            </div>
          )}
          {fileUrl && content !== fileUrl && (
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2">
              {content}
              {isUpdated && !deleted && (
                <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">
                  (edited)
                </span>
              )}
            </p>
          )}
          {!fileUrl && !isEditing && (
            <p
              className={cn(
                "text-sm text-zinc-600 dark:text-zinc-300",
                deleted &&
                  "italic text-zinc-500 dark:text-zinc-400 text-xs mt-1"
              )}
            >
              {content}
              {isUpdated && !deleted && (
                <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">
                  (edited)
                </span>
              )}
            </p>
          )}
          {!fileUrl && isEditing && (
            <Form {...form}>
              <form
                className="flex items-center w-full gap-x-2 pt-2"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          disabled={isLoading}
                          className="p-2 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                          placeholder="Edited message"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="sm"
                  variant="primary"
                >
                  Save
                </Button>
              </form>
              <span className="text-[10px] mt-1 text-zinc-400">
                Press escape to cancel, enter to save
              </span>
            </Form>
          )}
        </div>
      </div>
      {canDeleteMessage && (
        <div className="flex md:opacity-0 md:group-hover:opacity-100 transition items-center gap-x-2 absolute p-1 -top-2 right-5 bg-white dark:bg-zinc-800 border rounded-sm z-10">
          {canEditMessage && (
            <ActionTooltip label="Edit">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="cursor-pointer"
              >
                <Edit className="w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition" />
              </button>
            </ActionTooltip>
          )}
          <ActionTooltip label="Delete">
            <button
              type="button"
              onClick={() =>
                onOpen("deleteMessage", {
                  apiUrl: `${socketUrl}/${id}`,
                  query: socketQuery,
                })
              }
              className="cursor-pointer"
            >
              <Trash className="w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition" />
            </button>
          </ActionTooltip>
        </div>
      )}
    </div>
  );
};
