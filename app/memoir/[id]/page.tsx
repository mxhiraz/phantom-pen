import Memoir from "@/components/memoir";
import ProfileHeader from "@/components/ProfileHeader";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";

export default async function MemoirPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await fetchQuery(api.users.getUserByClerkId, {
    clerkId: `user_${id}`,
  });

  if (!user) {
    return notFound();
  }

  return (
    <div className="w-full md:space-y-3 max-w-[727px] mx-auto">
      <ProfileHeader username={user.username} avatarUrl={user.profilePicture} />
      <Memoir isPublic={true} clerkId={`user_${id}`} />
    </div>
  );
}
