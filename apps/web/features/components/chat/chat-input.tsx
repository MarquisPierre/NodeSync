"use client";

import axios from "axios";
import qs from "query-string";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { generateUploadDropzone } from "@uploadthing/react";
import { Plus, X } from "lucide-react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/features/components/ui/form";
import { Input } from "@/features/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/features/components/ui/dialog";
// import { EmojiPicker } from "./emoji-picker";

const UploadDropzone = generateUploadDropzone<OurFileRouter>();

interface ChatInputProps {
  apiUrl: string;
  query: Record<string, any>;
  name: string;
  type: "conversation" | "channel";
}

const formSchema = z.object({
  content: z.string(),
});

export const ChatInput = ({ apiUrl, query, name, type }: ChatInputProps) => {
  const queryClient = useQueryClient();
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [fileUrls, setFileUrls] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const caption = values.content.trim();

    if (!caption && fileUrls.length === 0) return;

    try {
      const url = qs.stringifyUrl({ url: apiUrl, query });

      if (fileUrls.length === 0) {
        await axios.post(url, { content: caption });
      } else {
        for (let i = 0; i < fileUrls.length; i++) {
          const fileUrl = fileUrls[i];
          await axios.post(url, {
            fileUrl,
            // The send route needs non-empty content, so fall back to the file URL
            content: i === 0 && caption ? caption : fileUrl,
          });
        }
      }

      form.reset();
      setFileUrls([]);

      const chatId = query.channelId ?? query.conversationId;
      if (chatId) {
        await queryClient.invalidateQueries({ queryKey: [`chat:${chatId}`] });
      }
    } catch (error) {
      console.log("[CHAT_INPUT_SEND]", error);
    }
  };

  return (
    <>
      <Dialog open={isAttachOpen} onOpenChange={setIsAttachOpen}>
        <DialogContent className="bg-white text-black p-0 overflow-hidden">
          <DialogHeader className="pt-8 px-6">
            <DialogTitle className="text-2xl text-center font-bold">
              Add attachments
            </DialogTitle>
            <DialogDescription className="text-center text-zinc-500">
              Pick one or more images, then add a message if you want
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-8">
            <UploadDropzone
              endpoint="messageFile"
              onClientUploadComplete={(res) => {
                const urls = (res ?? []).map((file) => file.ufsUrl);
                setFileUrls((current) => [...current, ...urls]);
                setIsAttachOpen(false);
              }}
              onUploadError={(error: Error) => {
                console.log("[ATTACH_UPLOAD]", error);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {fileUrls.length > 0 && (
            <div className="flex flex-wrap gap-4 px-6 pt-6">
              {fileUrls.map((fileUrl) => (
                <div
                  key={fileUrl}
                  className="relative h-24 w-24 rounded-md overflow-hidden bg-secondary"
                  style={{
                    boxShadow:
                       "0 0 24px 8px rgba(0, 0, 0, 0.4), 0 12px 30px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  <Image
                    src={fileUrl}
                    alt="Attachment preview"
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFileUrls((current) =>
                        current.filter((u) => u !== fileUrl)
                      )
                    }
                    className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full shadow-sm"
                    aria-label="Remove attachment"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative p-4 pb-6">
                    <button
                      type="button"
                      onClick={() => setIsAttachOpen(true)}
                      className="absolute top-7 left-8 h-[24px] w-[24px] bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 transition rounded-full p-1 flex items-center justify-center"
                    >
                      <Plus className="text-white dark:text-[#313338]" />
                    </button>
                    <Input
                      disabled={isLoading}
                      className="px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                      placeholder={
                        fileUrls.length > 0
                          ? "Add a message (optional)"
                          : `Message ${
                              type === "conversation" ? name : "#" + name
                            }`
                      }
                      {...field}
                    />
                    {/* <div className="absolute top-7 right-8">
                      <EmojiPicker
                        onChange={(emoji: string) =>
                          field.onChange(`${field.value} ${emoji}`)
                        }
                      />
                    </div> */}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </>
  );
};