import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  format,
  formatDistanceToNow,
  differenceInHours,
  parseISO,
  isValid,
} from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a timestamp string according to the following rules:
 * - If less than 12 hours ago: "HH:mm - X hours ago"
 * - If 12 hours or more: "HH:mm - M/D/YYYY"
 * @param timestamp ISO string or Date
 * @returns formatted string
 */
export function formatNoteTimestamp(timestamp: string | Date | number): string {
  if (typeof timestamp === "number") {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60)
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hour${
        Math.floor(diffInMinutes / 60) > 1 ? "s" : ""
      } ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${
      Math.floor(diffInMinutes / 1440) > 1 ? "s" : ""
    } ago`;
  }
  let date: Date;
  if (typeof timestamp === "string") {
    date = parseISO(timestamp);
    if (!isValid(date)) {
      // fallback for non-ISO strings
      date = new Date(timestamp);
    }
  } else {
    date = timestamp;
  }
  const now = new Date();
  const hoursAgo = differenceInHours(now, date);
  const timePart = format(date, "HH:mm");
  if (hoursAgo < 12) {
    // e.g. "03:21 - 3 hours ago"
    return `${timePart} - ${formatDistanceToNow(date, {
      addSuffix: true,
    }).replace("about ", "")}`;
  } else {
    // e.g. "03:55 - 6/30/2025"
    return `${timePart} - ${format(date, "M/d/yyyy")}`;
  }
}

export const RECORDING_TYPES: {
  name: string;
  value: string;
}[] = [
  {
    name: "Summary",
    value: "summary",
  },
  {
    name: "Quick Note",
    value: "quick-note",
  },
  {
    name: "List",
    value: "list",
  },
  {
    name: "Blog post",
    value: "blog",
  },
  {
    name: "Email",
    value: "email",
  },
  // {
  //   name: "Custom Prompt",
  //   value: "custom-prompt",
  // },
];

/**
 * Strips markdown formatting from text
 * @param markdown - The markdown text to strip
 * @returns Plain text without markdown formatting
 */
export function stripMarkdown(markdown: string): string {
  if (!markdown) return "";

  return (
    markdown
      // Remove headers
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bold/italic
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      // Remove images but keep alt text
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
      .replace(
        /https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|gif|webp|svg|mp4|webm|ogg)/gi,
        ""
      )
      // Remove malformed image syntax like !identifier without URL
      .replace(/![a-zA-Z0-9\-]+/g, "")
      // Remove blockquotes
      .replace(/^>\s+/gm, "")
      // Remove lists
      .replace(/^[\s]*[-*+]\s+/gm, "")
      .replace(/^[\s]*\d+\.\s+/gm, "")
      // Remove horizontal rules
      .replace(/^[\s]*[-*_]{3,}[\s]*$/gm, "")
      // Clean up extra whitespace
      .replace(/\n\s*\n/g, "\n")
      .trim()
  );
}

// Define PartialBlock type
type PartialBlock = {
  type: string; // "heading", "paragraph", etc.
  content: string; // text content
  props?: { level?: number };
};

// Function to parse markdown into PartialBlocks (no list support)
export function parseMarkdownToBlocks(markdown: string): PartialBlock[] {
  const lines = markdown.split("\n");
  const blocks: PartialBlock[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue; // skip empty lines

    // Heading
    if (line.startsWith("#")) {
      // Count number of leading # symbols
      const match = line.match(/^#+/);
      let level = match ? match[0].length + 1 : 1;

      const content = stripMarkdown(line);
      blocks.push({ type: "heading", content, props: { level } });
      continue;
    }

    // Paragraph
    blocks.push({ type: "paragraph", content: stripMarkdown(line) });
  }

  return blocks;
}
