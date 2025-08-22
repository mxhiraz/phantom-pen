// Convex database and scheduling constants
export const MEMOIR_GENERATION_DELAY = 7 * 1000; // 7 seconds in milliseconds

// Database table names
export const TABLES = {
  USERS: "users",
  WHISPERS: "whispers",
  MEMOIRS: "memoirs",
  SCHEDULED_MEMOIR_GENERATION: "scheduledMemoirGeneration",
} as const;

// Database index names
export const INDEXES = {
  BY_CLERK_ID: "by_clerk_id",
  BY_USER: "by_user",
  BY_WHISPER: "by_whisper",
  BY_MEMOIR_PUBLIC: "by_memoir_public",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NOT_AUTHENTICATED: "Not authenticated",
  USER_NOT_FOUND: "User not found",
  WHISPER_NOT_FOUND: "Whisper not found",
  UNAUTHORIZED: "Unauthorized",
  MEMOIRS_NOT_PUBLIC: "User's memoirs are not public",
  FAILED_TO_SCHEDULE: "Failed to schedule memoir generation",
  FAILED_TO_CANCEL: "Failed to cancel scheduled function",
} as const;

// Status values
export const STATUS = {
  ACTIVE: "active",
  PROCESSING: "processing",
  INACTIVE: "inactive",
  FAILED: "failed",
} as const;
