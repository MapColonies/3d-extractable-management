import config from 'config';
import { IUser } from '@src/common/interfaces';
import { IAuthPayload } from '../../common/constants';
import { UsersSchema } from './userSchema';

export function parseUsersJson(): IAuthPayload[] {
  try {
    const users = config.get<IUser>('users');

    const result = UsersSchema.safeParse(users);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}
