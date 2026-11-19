import type { APIResponse } from '@playwright/test';

export async function readJson<T>(res: APIResponse): Promise<T> {
  return (await res.json()) as T;
}
