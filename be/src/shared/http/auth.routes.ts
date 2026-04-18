import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
import prisma from '../../config/db.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../utils/jwt.js';

const router = Router();

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !bcrypt.compareSync(password, user.password)) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      if (!user.isActive) {
        res.status(401).json({ error: 'Account is disabled' });
        return;
      }

      const token = generateToken(user);
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
        },
      });
  } catch (error) {
    res.status(401).json({ error: error instanceof Error ? error.message : 'Login failed' });
  }
});

router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
      const existing = await prisma.user.findUnique({ where: { email } });

      if (existing) {
        res.status(400).json({ error: 'Email already exists' });
        return;
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role || 'STAFF',
        },
      });

      const token = generateToken(user);
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
  }
});

router.get('/auth/me', authenticate, async (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

// GET /auth/users - List all users (admin only)
router.get('/auth/users', authenticate, async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
