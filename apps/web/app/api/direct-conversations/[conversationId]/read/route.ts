import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { markDirectConversationRead } from "@/lib/direct-conversation";

// Marks a DM conversation as read for the signed-in user, which clears its unread
// count. Called when a message arrives in the conversation the user has open.
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

    const conversation = await markDirectConversationRead(
      conversationId,
      profile.id
    );

    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.log("[DIRECT_CONVERSATION_READ_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
