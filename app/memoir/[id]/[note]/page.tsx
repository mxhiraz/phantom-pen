import ProfileHeader from "@/components/ProfileHeader";
import MemoirEditor from "./_components/Editor";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";

export default async function MemoirPage({
  params,
}: {
  params: Promise<{ id: string; note: string }>;
}) {
  const { id, note } = await params;

  const user = await fetchQuery(api.users.getUserByClerkId, {
    clerkId: `user_${id}`,
  });

  if (!user) {
    return notFound();
  }

  return (
    <div className="w-full md:space-y-3 max-w-[727px] mx-auto">
      <MemoirEditor
        noteId={note}
        clerkId={id}
        username={user.username}
        avatarUrl={user.profilePicture}
      />
    </div>
  );
}
