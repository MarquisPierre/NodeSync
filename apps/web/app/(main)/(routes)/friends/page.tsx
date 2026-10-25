import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { MessageCircle, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { currentProfile } from "@/lib/current-profile";
import { FriendRequestStatus } from "@/server/generated/prisma/enums";
import UserAvatar from "@/features/components/user-avatar";
import { FriendRequestActions } from "@/features/components/friends/friend-request-actions";

interface FriendsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

const FriendsPage = async ({ searchParams }: FriendsPageProps) => {
  const { tab } = await searchParams;
  const activeTab = tab === "pending" ? "pending" : "all";

  const profile = await currentProfile();

  if (!profile) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  const requests = await prisma.friendRequest.findMany({
    where: {
      OR: [{ senderId: profile.id }, { receiverId: profile.id }],
    },
    include: { sender: true, receiver: true },
    orderBy: { updatedAt: "desc" },
  });

  // For each request, figure out who "the other person" is.
  const rows = requests.map((request) => ({
    ...request,
    other: request.senderId === profile.id ? request.receiver : request.sender,
  }));

  const friends = rows.filter((r) => r.status === FriendRequestStatus.ACCEPTED);
  const incoming = rows.filter(
    (r) => r.status === FriendRequestStatus.PENDING && r.receiverId === profile.id
  );
  const outgoing = rows.filter(
    (r) => r.status === FriendRequestStatus.PENDING && r.senderId === profile.id
  );

  const tabs = [
    { key: "all", label: "All", href: "/friends" },
    {
      key: "pending",
      label: incoming.length ? `Pending (${incoming.length})` : "Pending",
      href: "/friends?tab=pending",
    },
  ];

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <div className="flex items-center gap-x-4 h-12 px-4 border-b-2 border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-x-2 font-semibold text-black dark:text-white">
          <Users className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
          Friends
        </div>
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={cn(
              "rounded px-2 py-0.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition",
              activeTab === t.key && "bg-zinc-700/20 dark:bg-zinc-700 text-black dark:text-white"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === "all" && (
          <Section title={`All friends — ${friends.length}`} empty="No friends yet. Add people from a server's member list.">
            {friends.map((r) => (
              <Row key={r.id} name={r.other.name} imageUrl={r.other.imageUrl}>
                <div className="ml-auto flex items-center gap-x-2">
                  <Link
                    href={`/dms/${r.other.id}`}
                    className="rounded-full bg-zinc-200 dark:bg-zinc-700 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Link>
                  <FriendRequestActions
                    requestId={r.id}
                    removeLabel="Remove friend"
                    confirmName={r.other.name}
                  />
                </div>
              </Row>
            ))}
          </Section>
        )}

        {activeTab === "pending" && (
          <>
            <Section title={`Incoming — ${incoming.length}`} empty="No incoming requests.">
              {incoming.map((r) => (
                <Row key={r.id} name={r.other.name} imageUrl={r.other.imageUrl} subtitle="Incoming friend request">
                  <FriendRequestActions requestId={r.id} canAccept removeLabel="Decline" />
                </Row>
              ))}
            </Section>
            <Section title={`Outgoing — ${outgoing.length}`} empty="No outgoing requests.">
              {outgoing.map((r) => (
                <Row key={r.id} name={r.other.name} imageUrl={r.other.imageUrl} subtitle="Outgoing friend request">
                  <FriendRequestActions requestId={r.id} removeLabel="Cancel" />
                </Row>
              ))}
            </Section>
          </>
        )}
      </div>
    </div>
  );
};

const Section = ({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode[];
}) => (
  <div>
    <p className="mb-2 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
      {title}
    </p>
    {children.length === 0 ? (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{empty}</p>
    ) : (
      <div className="divide-y divide-zinc-200 dark:divide-zinc-700">{children}</div>
    )}
  </div>
);

const Row = ({
  name,
  imageUrl,
  subtitle,
  children,
}: {
  name: string;
  imageUrl: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-x-3 py-3">
    <UserAvatar src={imageUrl} className="h-8 w-8 md:h-8 md:w-8" />
    <div className="min-w-0">
      <p className="truncate font-semibold text-sm text-black dark:text-white">{name}</p>
      {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
    </div>
    {children}
  </div>
);

export default FriendsPage;
