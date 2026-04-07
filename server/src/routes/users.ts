import express, { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/verifyToken';
import User from '../models/User';

const router: Router = express.Router();

// Get current user info
router.get('/me', verifyToken, async (req: AuthRequest, res) => {
  try {
    console.log('GET /users/me called for uid:', req.uid);
    const user = await User.findOne({ uid: req.uid });
    if (!user) {
      console.log('User not found for uid:', req.uid);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('Found user:', user);
    res.json(user);
  } catch (error) {
    console.error('Error in GET /users/me:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create or update user profile
router.post('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    console.log('POST /users called with:', {
      uid: req.uid,
      email: req.email,
      body: req.body,
      headers: req.headers.authorization ? 'Bearer token present' : 'No auth header'
    });
    
    const { displayName, email } = req.body;

    if (!req.uid) {
      console.error('No uid found in request');
      return res.status(400).json({ error: 'User ID not found' });
    }

    let user = await User.findOne({ uid: req.uid });
    console.log('Found existing user:', user ? 'yes' : 'no');

    if (user) {
      // Update existing user
      user.displayName = displayName || user.displayName;
      user.email = email || user.email;
      await user.save();
      console.log('Updated user:', user);
    } else {
      // Create new user
      user = new User({
        uid: req.uid,
        email: req.email || email,
        displayName,
      });
      await user.save();
      console.log('Created new user:', user);
    }

    res.status(201).json(user);
  } catch (error) {
    console.error('Error in POST /users:', error);
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
