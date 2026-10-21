"use client";

import axios from "axios";
import qs from "query-string";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";

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
import { FileUpload } from "@/features/components/file-upload";
// import { EmojiPicker } from "./emoji-picker";

interface ChatInputProps {
  apiUrl: string;
  query: Record<string, any>;
  name: string;
  type: "conversation" | "channel";
}

const formSchema = z
  .object({
    content: z.string(),
    fileUrl: z.string(),
  })
  .refine((values) => values.content.trim() !== "" || values.fileUrl !== "", {
    message: "Type a message or attach a file.",
  });

export const ChatInput = ({ apiUrl, query, name, type }: ChatInputProps) => {
  const queryClient = useQueryClient();
  const [isAttachOpen, setIsAttachOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      fileUrl: "",
    },
  });

  const isLoading = form.formState.isSubmitting;
  const fileUrl = form.watch("fileUrl");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: apiUrl,
        query,
      });

      await axios.post(url, {
        fileUrl: values.fileUrl || undefined,
        // The send route needs non-empty content, so fall back to the file URL
        content: values.content.trim() || values.fileUrl,
      });

      form.reset();

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
              Add an attachment
            </DialogTitle>
            <DialogDescription className="text-center text-zinc-500">
              Pick a file, then add a message if you want
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center text-center px-6 pb-8">
            <FileUpload
              endpoint="messageFile"
              value={fileUrl}
              onChange={(url?: string) => {
                form.setValue("fileUrl", url ?? "", { shouldValidate: true });
                if (url) setIsAttachOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {fileUrl && (
     <div className="px-4 pt-4">
   <div
  className="relative h-24 w-24 rounded-md overflow-hidden bg-secondary"
  style={{
    boxShadow:
        "0 0 24px 8px rgba(0, 0, 0, 0.7), 0 12px 30px rgba(0, 0, 0, 0.9)",
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
        onClick={() => form.setValue("fileUrl", "")}
        className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full shadow-sm"
        aria-label="Remove attachment"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
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
                        fileUrl
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