import { z } from 'zod';
import { email } from './common.js';

export const loginBody = z.object({
  email,
  password: z.string().min(1, 'Required').max(128),
});
