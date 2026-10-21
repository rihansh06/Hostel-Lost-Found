const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  room: z.string().trim().min(1, 'Room number is required').max(20),
  inviteCode: z.string().trim().min(1, 'Hostel invite code is required'),
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const createPostSchema = z.object({
  type: z.enum(['lost', 'found'], {
    errorMap: () => ({ message: "Type must be either 'lost' or 'found'" }),
  }),
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().trim().min(5, 'Description must be at least 5 characters').max(2000),
  category: z.enum(['electronics', 'clothing', 'keys', 'bottle', 'documents', 'other'], {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
  spot: z.string().trim().min(1, 'Spot is required'),
  happenedAt: z.string().optional().or(z.date().optional()),
  hiddenDetails: z.string().trim().max(1000).optional().nullable(),
  verificationQuestions: z
    .union([
      z.array(z.string().trim().min(3, 'Question must be at least 3 characters')),
      z.string().transform((val) => {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return val ? [val] : [];
        }
      }),
    ])
    .optional(),
});

const filterPostsSchema = z.object({
  type: z.enum(['lost', 'found']).optional(),
  category: z.enum(['electronics', 'clothing', 'keys', 'bottle', 'documents', 'other']).optional(),
  spot: z.string().trim().optional(),
  status: z.enum(['open', 'matched', 'claim_pending', 'returned', 'expired']).optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }
  req.body = result.data;
  next();
};

const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Query parameter validation failed',
      errors: result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }
  req.query = result.data;
  next();
};

module.exports = {
  registerSchema,
  loginSchema,
  createPostSchema,
  filterPostsSchema,
  validateBody,
  validateQuery,
};
