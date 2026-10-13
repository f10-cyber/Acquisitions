import { z } from 'zod';
import { paginationQuerySchema, queryBooleanSchema } from '#validations/common.validation.js';

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
    avatarUrl: z.url('avatarUrl must be a valid URL').max(2048).optional(),
    bio: z.string().trim().max(1000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field to update' });

export const adminSetRoleSchema = z.object({
  role: z.enum(['user', 'seller', 'buyer', 'admin']),
});

export const adminListUsersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(255).optional(),
  role: z.enum(['user', 'seller', 'buyer', 'admin']).optional(),
  isActive: queryBooleanSchema,
  sort: z.enum(['newest', 'oldest', 'name']).default('newest'),
});
