import { z } from 'zod';

const AuthPayloadSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const UsersSchema = z.array(AuthPayloadSchema).min(1, 'At least one user is required');
