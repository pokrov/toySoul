"use client";
export async function api<T>(url: string, data?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: data === undefined ? "GET" : "POST",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
  return json as T;
}
export function message(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
