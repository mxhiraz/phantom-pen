"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Lock, Globe, Copy, Check } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export function PrivacyTogglePopover() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const togglePrivacy = useMutation(api.users.toggleMemoirPrivacy);
  const currentUser = useQuery(api.users.getUser, {
    clerkId: user?.id || "",
  });

  const handleTogglePrivacy = async () => {
    if (!user?.id) return;

    try {
      await togglePrivacy({ clerkId: user.id });
    } catch (error) {
      toast.error("Failed to update privacy setting");
    }
  };

  const handleCopyShareUrl = async () => {
    if (!currentUser?.isMemoirPublic) return;

    const shareUrl = `${window.location.origin}/memoir/${user?.id.replace(
      "user_",
      ""
    )}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy share URL");
    }
  };

  if (!user?.id) return null;

  const isPublic = currentUser?.isMemoirPublic || false;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-gray-100"
          aria-label="Toggle memoir privacy"
        >
          {isPublic ? (
            <Globe className="h-4 w-4 text-primary" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent sideOffset={6} className="w-64 p-4" align="center">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Memoir Privacy</span>
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="h-4 w-4 text-primary" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {isPublic ? "Public" : "Private"}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {isPublic
              ? "Your memoir is visible to everyone. Others can view and share your memoir."
              : "Your memoir is private. Only you can see it."}
          </p>

          <div className="space-y-2">
            <Button
              onClick={handleTogglePrivacy}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Make {isPublic ? "Private" : "Public"}
            </Button>

            {isPublic && (
              <Button
                onClick={handleCopyShareUrl}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Share URL
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
