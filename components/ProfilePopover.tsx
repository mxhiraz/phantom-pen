"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VoiceTextarea } from "@/components/VoiceTextarea";
import { LogOut, Settings, User, Edit3 } from "lucide-react";
import { toast } from "sonner";
import {
  useOnboarding,
  OnboardingData,
} from "@/components/hooks/useOnboarding";

export function ProfilePopover() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [showSettings, setShowSettings] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks

    setIsLoggingOut(true);
    try {
      // Attempt to sign out with redirect
      await signOut({ redirectUrl: "/" });

      // Show success message
    } catch (error) {
      console.error("Failed to logout:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = () => {
    const first = user.firstName?.charAt(0) || "";
    const last = user.lastName?.charAt(0) || "";
    return (
      (first + last).toUpperCase() ||
      user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase() ||
      "U"
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="h-9 w-9 border-2 cursor-pointer border-primary/50">
            <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
            <AvatarFallback className=" bg-blue-100 text-blue-600 text-sm font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 "
          side="bottom"
          align="end"
          sideOffset={4}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setShowSettings(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-red-600 focus:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        user={user}
      />
    </>
  );
}

function SettingsDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);

  // Questions editing state
  const [isEditingQuestions, setIsEditingQuestions] = useState(false);
  const [questionsData, setQuestionsData] = useState<Partial<OnboardingData>>(
    {}
  );
  const [isSavingQuestions, setIsSavingQuestions] = useState(false);

  const { userData, updateOnboarding } = useOnboarding();

  // Initialize questions data when user data loads
  useEffect(() => {
    if (userData) {
      setQuestionsData({
        opener: userData.opener || "",
        feelingIntent: userData.feelingIntent || "",
        voiceStyle: userData.voiceStyle || "scene-focused",
        writingStyle: userData.writingStyle || "clean-simple",
        candorLevel: userData.candorLevel || "fully-candid",
        humorStyle: userData.humorStyle || "natural-humor",
      });
    }
  }, [userData]);

  const handleSave = async () => {
    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }

    setIsSaving(true);
    try {
      await user.update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });

      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setIsEditing(false);
  };

  const handleImageUpdate = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setIsUpdatingImage(true);
    try {
      await user.setProfileImage({ file });
      toast.success("Profile image updated successfully");
    } catch (error) {
      console.error("Failed to update profile image:", error);
      toast.error("Failed to update profile image");
    } finally {
      setIsUpdatingImage(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (!questionsData.opener?.trim()) {
      toast.error("Opening question is required");
      return;
    }

    setIsSavingQuestions(true);
    try {
      await updateOnboarding({
        clerkId: user.id,
        ...questionsData,
        onboardingCompleted: true, // Keep onboarding completed
      });

      setIsEditingQuestions(false);
      toast.success("Questions updated successfully");
    } catch (error) {
      console.error("Failed to update questions:", error);
      toast.error("Failed to update questions");
    } finally {
      setIsSavingQuestions(false);
    }
  };

  const handleCancelQuestions = () => {
    if (userData) {
      setQuestionsData({
        opener: userData.opener || "",
        feelingIntent: userData.feelingIntent || "",
        voiceStyle: userData.voiceStyle || "scene-focused",
        writingStyle: userData.writingStyle || "clean-simple",
        candorLevel: userData.candorLevel || "fully-candid",
        humorStyle: userData.humorStyle || "natural-humor",
      });
    }
    setIsEditingQuestions(false);
  };

  const getInitials = () => {
    const first = user.firstName?.charAt(0) || "";
    const last = user.lastName?.charAt(0) || "";
    return (
      (first + last).toUpperCase() ||
      user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase() ||
      "U"
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <label
                  htmlFor="profile-image"
                  className="cursor-pointer block"
                  title="Click to change profile image"
                >
                  <Avatar className="w-14 h-14 border-2 border-primary/50 hover:border-primary/70 transition-colors">
                    <AvatarImage
                      src={user.imageUrl}
                      alt={user.fullName || "User"}
                    />
                    <AvatarFallback className=" bg-blue-100 text-blue-600 text-xl font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </label>
                {isUpdatingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpdate}
                  className="hidden"
                  disabled={isUpdatingImage}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {user.fullName || "User"}
                </h3>
                <p className="text-sm text-gray-500">
                  {user.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  Profile Information
                </h4>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-8 -mr-3"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-sm font-medium text-gray-700"
                      >
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter first name"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="lastName"
                        className="text-sm font-medium text-gray-700"
                      >
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter last name"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>Save Changes</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="px-4"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="text-gray-900 font-medium">
                      {user.fullName || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-900 font-medium">
                      {user.emailAddresses[0]?.emailAddress}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Your Story Questions
              </h4>
              {!isEditingQuestions && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingQuestions(true)}
                  className="h-8 -mr-3"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </Button>
              )}
            </div>

            {isEditingQuestions ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      What's your story about?
                    </Label>
                    <VoiceTextarea
                      value={questionsData.opener || ""}
                      onChange={(e) =>
                        setQuestionsData((prev) => ({
                          ...prev,
                          opener: e.target.value,
                        }))
                      }
                      placeholder="Tell us about your story..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      What feeling do you want readers to take away?
                    </Label>
                    <VoiceTextarea
                      value={questionsData.feelingIntent || ""}
                      onChange={(e) =>
                        setQuestionsData((prev) => ({
                          ...prev,
                          feelingIntent: e.target.value,
                        }))
                      }
                      placeholder="What impact do you want to have?"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Voice Style
                    </Label>
                    <Select
                      value={questionsData.voiceStyle}
                      onValueChange={(value) =>
                        setQuestionsData((prev) => ({
                          ...prev,
                          voiceStyle: value as any,
                        }))
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select voice style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scene-focused">
                          Scene-focused
                        </SelectItem>
                        <SelectItem value="reflection-focused">
                          Reflection-focused
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Writing Style
                    </Label>
                    <Select
                      value={questionsData.writingStyle}
                      onValueChange={(value) =>
                        setQuestionsData((prev) => ({
                          ...prev,
                          writingStyle: value as any,
                        }))
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select writing style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clean-simple">
                          Clean & Simple
                        </SelectItem>
                        <SelectItem value="musical-descriptive">
                          Musical & Descriptive
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Candor Level
                    </Label>
                    <Select
                      value={questionsData.candorLevel}
                      onValueChange={(value) =>
                        setQuestionsData((prev) => ({
                          ...prev,
                          candorLevel: value as any,
                        }))
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select candor level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fully-candid">
                          Fully Candid
                        </SelectItem>
                        <SelectItem value="softened-details">
                          Softened Details
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Humor Style
                    </Label>
                    <Select
                      value={questionsData.humorStyle}
                      onValueChange={(value) =>
                        setQuestionsData((prev) => ({
                          ...prev,
                          humorStyle: value as any,
                        }))
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select humor style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="natural-humor">
                          Natural Humor
                        </SelectItem>
                        <SelectItem value="background-humor">
                          Background Humor
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleSaveQuestions}
                    disabled={isSavingQuestions}
                    className="flex-1"
                  >
                    {isSavingQuestions ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>Save Changes</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelQuestions}
                    className="px-4"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Story Focus:</span>
                  <span className="text-gray-900 max-w-[200px] truncate font-medium">
                    {userData?.opener || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reader Impact:</span>
                  <span className="text-gray-900 max-w-[200px] truncate font-medium">
                    {userData?.feelingIntent || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Voice Style:</span>
                  <span className="text-gray-900 max-w-[200px] truncate font-medium">
                    {userData?.voiceStyle
                      ? userData.voiceStyle
                          .replace("-", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Writing Style:</span>
                  <span className="text-gray-900 max-w-[200px] truncate font-medium">
                    {userData?.writingStyle
                      ? userData.writingStyle
                          .replace("-", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Candor Level:</span>
                  <span className="text-gray-900 max-w-[200px] truncate font-medium">
                    {userData?.candorLevel
                      ? userData.candorLevel
                          .replace("-", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Humor Style:</span>
                  <span className="text-gray-900 max-w-[200px] truncate font-medium">
                    {userData?.humorStyle
                      ? userData.humorStyle
                          .replace("-", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "Not set"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
