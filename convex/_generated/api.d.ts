/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as files from "../files.js";
import type * as functions from "../functions.js";
import type * as http from "../http.js";
import type * as memoirs from "../memoirs.js";
import type * as transcribe from "../transcribe.js";
import type * as users from "../users.js";
import type * as voiceUploads from "../voiceUploads.js";
import type * as whispers from "../whispers.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  files: typeof files;
  functions: typeof functions;
  http: typeof http;
  memoirs: typeof memoirs;
  transcribe: typeof transcribe;
  users: typeof users;
  voiceUploads: typeof voiceUploads;
  whispers: typeof whispers;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
