import { IAuthPayload } from '../../common/constants';

export function parseUsersJson(): IAuthPayload[] {
  const raw = process.env.USERS_JSON ?? '[]';

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) return [];

    function isAuthPayload(u: unknown): u is IAuthPayload {
      return (
        typeof u === 'object' &&
        u !== null &&
        'username' in u &&
        'password' in u &&
        typeof (u as Record<string, unknown>).username === 'string' &&
        typeof (u as Record<string, unknown>).password === 'string'
      );
    }

    return parsed.filter(isAuthPayload);
  } catch {
    return [];
  }
}
