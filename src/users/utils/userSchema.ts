import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/naming-convention
const AuthPayloadSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// eslint-disable-next-line @typescript-eslint/naming-convention
export const UsersSchema = z.array(AuthPayloadSchema);
