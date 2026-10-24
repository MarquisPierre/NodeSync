"use client";

import { Smile } from "lucide-react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";

import data from "@emoji-mart/data";

//https://github.com/missive/emoji-mart/issues/849
//import Picker from "@emoji-mart/react";
const Picker = dynamic(
  () => import("@emoji-mart/react").then((mod) => mod.default),
  { ssr: false }
);

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/components/ui/popover";

interface EmojiPickerProps {
  onChange: (value: string) => void;
}

export const EmojiPicker = ({ onChange }: EmojiPickerProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <Popover>
      <PopoverTrigger>
        <Smile className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition" />
      </PopoverTrigger>
      <PopoverContent
        side="right"
        sideOffset={40}
        className="w-auto p-0 bg-transparent ring-0 shadow-none mb-16"
      >
        <Picker
          theme={resolvedTheme}
          data={data}
          onEmojiSelect={(emoji: any) => onChange(emoji.native)}
        />
      </PopoverContent>
    </Popover>
  );
};