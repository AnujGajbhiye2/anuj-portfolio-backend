import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env, isDev } from '../../config/env';
import { jwtGuard } from '../../middleware/jwtGuard';

const router = Router();

// Hash the password once at module load — not on every login request.
// Stored in memory only; never written back to disk.
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(env.ADMIN_PASSWORD, 10);

const COOKIE_NAME = 'token';
const COOKIE_OPTIONS = {
  httpOnly: true,                    // not readable by JS
  secure: !isDev,                    // HTTPS only in production
  sameSite: 'strict' as const,       // no cross-site requests
  maxAge: 8 * 60 * 60 * 1000,       // 8 hours in ms
  path: '/',
};

const loginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response): void => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: 'Password is required', requestId: req.id });
    return;
  }

  const { password } = result.data;

  // bcrypt.compareSync is synchronous — fine for a single-admin login endpoint
  const valid = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);

  if (!valid) {
    req.log.warn({ url: req.url }, 'failed admin login attempt');
    res.status(401).json({ error: 'Invalid password', requestId: req.id });
    return;
  }

  const token = jwt.sign({ role: 'admin' }, env.JWT_SECRET, { expiresIn: '8h' });
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

  req.log.info('admin login successful');
  res.json({ user: { role: 'admin' } });
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.status(204).send();
});

// GET /api/auth/me — returns current user if JWT is valid
router.get('/me', jwtGuard, (_req: Request, res: Response): void => {
  res.json({ user: { role: 'admin' } });
});

export { router as authRouter };
