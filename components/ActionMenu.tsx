"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Trash2,
  Lock,
  Globe,
  Share2,
  Check,
  Edit,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { useUser } from "@clerk/nextjs";

interface ActionMenuProps {
  itemId: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  showPrivacyToggle?: boolean;
  showShare?: boolean;
  showEdit?: boolean;
  showDownload?: boolean;
  showDelete?: boolean;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

export function ActionMenu({
  itemId,
  className = "",
  size = "icon",
  variant = "ghost",
  showPrivacyToggle = true,
  showShare = true,
  showEdit = false,
  showDownload = true,
  showDelete = true,
  align = "end",
  side = "bottom",
}: ActionMenuProps) {
  const router = useRouter();
  const user = useUser();
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Convex mutations and queries
  const togglePrivacyMutation = useMutation(api.whispers.togglePrivacy);
  const deleteMutation = useMutation(api.whispers.deleteWhisper);

  // Get whisper data
  const whisper = useQuery(api.whispers.getWhisper, { id: itemId as any });

  const isPublic = whisper?.public ?? false;
  const itemTitle = whisper?.title ?? "Voice Note";

  const handleCopyShareUrl = async () => {
    const shareUrl = `${window.location.origin}/memoir/${user.user?.id.replace(
      "user_",
      ""
    )}/${itemId}`;

    try {
      if (navigator.canShare({ url: shareUrl })) {
        navigator.share({
          title: itemTitle,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      toast.error("Failed to copy share URL");
    }
  };

  const handleShare = () => {
    if (isPublic) {
      handleCopyShareUrl();
    } else {
      toast.info("Make this voice note public first to enable sharing", {
        description: "Private voice notes cannot be shared with others",
      });
    }
  };

  const handleTogglePrivacy = async () => {
    try {
      await togglePrivacyMutation({ id: itemId as any });
    } catch (error) {
      toast.error("Failed to update privacy setting");
    }
  };

  const handleEdit = () => {
    router.push(`/whispers/${itemId}`);
  };

  const handleDownload = () => {
    if (whisper?.fullTranscription) {
      const blob = new Blob([whisper.fullTranscription], {
        type: "text/plain",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${whisper.title || "voice-note"}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteMutation({ id: itemId as any });

      router.push("/whispers");
    } catch (error) {
      toast.error("Failed to delete voice note");
    }
    setShowDeleteConfirm(false);
  };

  // Determine which actions to show
  const actions = [];

  if (showPrivacyToggle) {
    actions.push({
      key: "privacy",
      label: isPublic ? "Make Private" : "Make Public",
      icon: isPublic ? (
        <Lock className="w-4 h-4 mr-2" />
      ) : (
        <Globe className="w-4 h-4 mr-2" />
      ),
      onClick: handleTogglePrivacy,
      separator: true,
      disabled: false,
    });
  }

  if (showEdit) {
    actions.push({
      key: "edit",
      label: "Edit",
      icon: <Edit className="w-4 h-4 mr-2" />,
      onClick: handleEdit,
      separator: true,
      disabled: false,
    });
  }

  if (showDownload) {
    actions.push({
      key: "download",
      label: "Download",
      icon: <Download className="w-4 h-4 mr-2" />,
      onClick: handleDownload,
      separator: true,
      disabled: false,
    });
  }

  if (showShare) {
    actions.push({
      key: "share",
      label: copied ? "Copied!" : "Share",
      icon: copied ? (
        <Check className="w-4 h-4 mr-2" />
      ) : (
        <Share2 className="w-4 h-4 mr-2" />
      ),
      onClick: handleShare,
      separator: true,
      disabled: !isPublic,
    });
  }

  if (showDelete) {
    actions.push({
      key: "delete",
      label: "Delete",
      icon: <Trash2 className="w-4 h-4 mr-2" />,
      onClick: handleDelete,
      separator: false,
      destructive: true,
      disabled: false,
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size={size}
            variant={variant}
            className={`p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 ${className}`}
            aria-label="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          sideOffset={0}
          side={side}
          className="w-48"
        >
          {actions.map((action, index) => (
            <div key={action.key}>
              <DropdownMenuItem
                onClick={action.onClick}
                disabled={action.disabled}
                className={
                  action.destructive
                    ? "text-red-600 focus:text-red-600 focus:bg-red-50"
                    : action.disabled
                    ? "text-gray-400 cursor-not-allowed opacity-50"
                    : ""
                }
              >
                {action.icon}
                {action.label}
              </DropdownMenuItem>
              {action.separator && index < actions.length - 1 && (
                <DropdownMenuSeparator />
              )}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <DeleteConfirmationDialog
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          title={`Delete "${itemTitle}"?`}
        />
      )}
    </>
  );
}
