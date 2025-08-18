"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  isLoading?: boolean;
}

export function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  description = "This action cannot be undone. This will permanently delete the note and all its associated data.",
  isLoading = false,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" showCloseButton={false}>
        <DialogHeader className="!p-0 text-start">
          <div className="flex  gap-3 mb-2 !px-0">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 !px-0">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 pt-4">
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Note
              </>
            )}
          </Button>

          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
