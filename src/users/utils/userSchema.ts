import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/naming-convention
const AuthPayloadSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// eslint-disable-next-line @typescript-eslint/naming-convention
export const UsersSchema = z.array(AuthPayloadSchema).min(1, 'At least one user is required');
