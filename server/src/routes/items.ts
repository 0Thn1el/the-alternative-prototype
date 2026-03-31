import express, { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/verifyToken';
import Item from '../models/Item';

const router: Router = express.Router();

router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const items = await Item.find({ uid: req.uid });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

router.post('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const newItem = new Item({
      ...req.body,
      uid: req.uid,
    });
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

router.put('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

router.delete('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;