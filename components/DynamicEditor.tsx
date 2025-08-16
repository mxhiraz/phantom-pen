"use client";

import dynamic from "next/dynamic";

export const Editor = dynamic(() => import("./BlocknoteEditor"), {
  ssr: false,
});
