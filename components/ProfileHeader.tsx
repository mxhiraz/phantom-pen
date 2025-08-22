"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

interface ProfileHeaderProps {
  username?: string;
  avatarUrl?: string;
}

export default function ProfileHeader({
  username = "Mahira",
  avatarUrl = "https://github.com/mxhiraz.png",
}: ProfileHeaderProps) {
  const handleShare = () => {
    try {
      if (navigator.share) {
        navigator.share({
          title: `${username}'s Memoir`,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 px-6">
      <div className="flex items-center gap-2">
        <Avatar className="size-12">
          <AvatarImage src={avatarUrl} alt={username} />
          <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-lg">{username}</h2>
          <p className="text-xs text-muted-foreground">Memoir</p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleShare}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    </div>
  );
}
