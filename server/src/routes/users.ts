import express, { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/verifyToken';
import User from '../models/User';

const router: Router = express.Router();

// Get current user info
router.get('/me', verifyToken, async (req: AuthRequest, res) => {
  try {
    const user = await User.findOne({ uid: req.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create or update user profile
router.post('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { displayName, email } = req.body;

    let user = await User.findOne({ uid: req.uid });

    if (user) {
      // Update existing user
      user.displayName = displayName || user.displayName;
      user.email = email || user.email;
      await user.save();
    } else {
      // Create new user
      user = new User({
        uid: req.uid,
        email: req.email || email,
        displayName,
      });
      await user.save();
    }

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create/update user' });
  }
});

// Get all users (admin only - optional)
router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const users = await User.find().select('-email');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user profile
router.put('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
