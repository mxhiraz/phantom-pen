import { clerkClient } from "@clerk/nextjs/server";

// Limits
const MINUTES_LIMIT_DEFAULT = 120;
const TRANSFORM_LIMIT_DEFAULT = 10;

const fallbackMinutes = {
  success: true,
  remaining: MINUTES_LIMIT_DEFAULT,
  limit: MINUTES_LIMIT_DEFAULT,
  reset: null,
};
const fallbackMinutesByok = {
  success: true,
  remaining: Infinity,
  limit: Infinity,
  reset: null,
};
const fallbackTransform = {
  success: true,
  remaining: TRANSFORM_LIMIT_DEFAULT,
  limit: TRANSFORM_LIMIT_DEFAULT,
  reset: null,
};
const fallbackTransformByok = {
  success: true,
  remaining: Infinity,
  limit: Infinity,
  reset: null,
};

function isGroqUser(email?: string) {
  return email && email.endsWith("@groq.com");
}

async function getUserEmail(clerkUserId?: string) {
  if (!clerkUserId) return undefined;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);
    return user.emailAddresses?.[0]?.emailAddress;
  } catch {
    return undefined;
  }
}

export async function limitMinutes({
  clerkUserId,
  isBringingKey,
  minutes,
}: {
  clerkUserId?: string;
  isBringingKey?: boolean;
  minutes: number;
}) {
  const email = await getUserEmail(clerkUserId);

  if (isBringingKey) {
    return fallbackMinutesByok;
  }
  if (isGroqUser(email)) {
    return fallbackMinutes;
  }

  // For now, return fallback limits since Redis is removed
  return fallbackMinutes;
}

export async function getMinutes({
  clerkUserId,
  isBringingKey,
}: {
  clerkUserId?: string;
  isBringingKey?: boolean;
}) {
  const email = await getUserEmail(clerkUserId);
  if (isBringingKey) {
    return fallbackMinutesByok;
  }
  if (isGroqUser(email)) {
    return fallbackMinutes;
  }

  return fallbackMinutes;
}

export async function limitTransformations({
  clerkUserId,
  isBringingKey,
}: {
  clerkUserId?: string;
  isBringingKey?: boolean;
}) {
  const email = await getUserEmail(clerkUserId);
  if (isBringingKey) {
    return fallbackTransformByok;
  }
  if (isGroqUser(email)) {
    return fallbackTransform;
  }

  return fallbackTransform;
}

export async function getTransformations({
  clerkUserId,
  isBringingKey,
}: {
  clerkUserId?: string;
  isBringingKey?: boolean;
}) {
  const email = await getUserEmail(clerkUserId);
  if (isBringingKey) {
    return fallbackTransformByok;
  }
  if (isGroqUser(email)) {
    return fallbackTransform;
  }

  return fallbackTransform;
}
