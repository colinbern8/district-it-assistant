/**
 * Where the app gets its workflows from: the FastAPI backend.
 *
 * SERVER ONLY. These functions run inside Next.js server components, never in
 * the student's browser. The browser only talks to Next.js; Next.js talks to
 * FastAPI. That's why API_BASE_URL doesn't start with NEXT_PUBLIC_.
 *
 * Every request is made at request time with no caching (Phase 2 decision),
 * so edits to knowledge_base/ show up immediately and `next build` never
 * needs the backend to be running.
 */
import { connection } from "next/server";
import { cache } from "react";
import type { CategoryGroup, Workflow } from "./types";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

/** Give up after this long, so a stuck backend can't leave students waiting. */
const API_TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS ?? 5000);

/**
 * The backend couldn't be reached, timed out, or answered with an error.
 * Pages catch this and send students to the school office instead.
 */
export class ApiUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ApiUnavailableError";
  }
}

/** GET a path from the API. Returns the Response for any HTTP status. */
async function apiGet(path: string): Promise<Response> {
  // Tell Next.js this data belongs to the request, not the build: the
  // prerendered page shows the loading placeholder, and the fetch runs per visit.
  await connection();

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    // Network failure (backend not running) or the timeout above.
    console.error(`[api] GET ${path} failed:`, error);
    throw new ApiUnavailableError(`Could not reach the API for ${path}`, { cause: error });
  }
}

async function readJson<T>(response: Response, path: string): Promise<T> {
  if (!response.ok) {
    console.error(`[api] GET ${path} returned HTTP ${response.status}`);
    throw new ApiUnavailableError(`API returned HTTP ${response.status} for ${path}`);
  }
  return (await response.json()) as T;
}

/** Categories in display order, each with its visible workflows. Empty ones are skipped. */
export async function getWorkflowsByCategory(): Promise<CategoryGroup[]> {
  const path = "/api/workflows";
  const body = await readJson<{ categories: CategoryGroup[] }>(await apiGet(path), path);
  return body.categories.filter((category) => category.workflows.length > 0);
}

/**
 * One workflow with shared steps (e.g. Powerwash) already merged in by the backend.
 * Returns null if it doesn't exist or isn't visible (a draft in production).
 *
 * React's cache() shares the result within ONE page request, so the page title
 * (generateMetadata) and the page content make a single API call between them.
 * It does not cache anything between requests.
 */
export const getWorkflow = cache(async (id: string): Promise<Workflow | null> => {
  const path = `/api/workflows/${encodeURIComponent(id)}`;
  const response = await apiGet(path);
  // 404 = no such workflow. 422 = the id isn't even a valid id. Both: "not found".
  if (response.status === 404 || response.status === 422) {
    return null;
  }
  return readJson<Workflow>(response, path);
});
