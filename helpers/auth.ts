import path from 'node:path';
import { env } from './env';

export type Account = 'trader1' | 'trader2' | 'approver1';

/** Where tests/auth.setup.ts saves each account's signed-in session. Git-ignored. */
export function authFile(account: Account): string {
  return path.join('playwright', '.auth', `${account}.json`);
}

export function credentialsOf(account: Account): { username: string; password: string } {
  switch (account) {
    case 'trader1':
      return { username: env.TRADER1_USERNAME, password: env.TRADER1_PASSWORD };
    case 'trader2':
      return { username: env.TRADER2_USERNAME, password: env.TRADER2_PASSWORD };
    case 'approver1':
      return { username: env.APPROVER1_USERNAME, password: env.APPROVER1_PASSWORD };
  }
}
