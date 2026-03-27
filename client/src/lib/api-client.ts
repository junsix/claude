import type { ApiError } from "@claude-copy/shared";

let activeProfileId: string = "";

export function setActiveProfileId(id: string): void {
  activeProfileId = id;
}

export function getActiveProfileId(): string {
  return activeProfileId;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(activeProfileId ? { "X-Profile-Id": activeProfileId } : {}),
    ...(options?.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(`/api${path}`, { ...options, headers });
  if (!res.ok) {
    const body = (await res.json()) as ApiError;
    throw new Error(body.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
