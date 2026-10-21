import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { markConversationRead } from "@/lib/conversation-read";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const conversation = await markConversationRead(conversationId, profile.id);

    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.log("[CONVERSATION_READ_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
