import express, { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/verifyToken';
import Wardrobe from '../models/Wardrobe';

const router: Router = express.Router();

router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const wardrobes = await Wardrobe.find({ uid: req.uid }).populate('items');
    res.json(wardrobes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wardrobes' });
  }
});

router.post('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    const wardrobe = new Wardrobe({
      uid: req.uid,
      name,
      items: [],
    });
    const saved = await wardrobe.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create wardrobe' });
  }
});

router.put('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const updated = await Wardrobe.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('items');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update wardrobe' });
  }
});

router.delete('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    await Wardrobe.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete wardrobe' });
  }
});

export default router;