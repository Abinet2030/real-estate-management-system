import express from 'express';
import Offer from '../models/Offer.js';

const router = express.Router();

// GET /api/offers?ownerId=...
router.get('/', async (req, res) => {
  try {
    const { ownerId } = req.query || {};
    if (!ownerId) return res.status(400).json({ error: 'ownerId is required' });
    const items = await Offer.find({ ownerId }).sort({ updatedAt: -1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('GET /offers error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/offers - buyer submits an offer
router.post('/', async (req, res) => {
  try {
    const { propertyId, ownerId, buyerName, buyerEmail, amount, currency = 'USD', message = '' } = req.body || {};
    if (!propertyId || !ownerId || !buyerName || !buyerEmail || amount == null) return res.status(400).json({ error: 'Missing fields' });
    const offer = await Offer.create({ propertyId, ownerId, buyerName, buyerEmail, amount: Number(amount), currency, message, history: [{ action: 'create', by: 'buyer', amount: Number(amount) }] });
    res.status(201).json({ offerId: offer._id });
  } catch (err) {
    console.error('POST /offers error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function changeStatus(req, res, nextStatus, historyAction, extra = {}) {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Not found' });
    if (historyAction === 'counter' && extra.amount == null) return res.status(400).json({ error: 'amount is required' });
    if (historyAction === 'counter') offer.amount = Number(extra.amount);
    offer.status = nextStatus;
    offer.history.push({ action: historyAction, by: 'owner', amount: offer.amount });
    await offer.save();
    res.json({ ok: true });
  } catch (err) {
    console.error(`POST /offers/:id/${historyAction} error:`, err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

router.post('/:id/accept', (req, res) => changeStatus(req, res, 'accepted', 'accept'));
router.post('/:id/reject', (req, res) => changeStatus(req, res, 'rejected', 'reject'));
router.post('/:id/counter', (req, res) => changeStatus(req, res, 'countered', 'counter', { amount: req.body?.amount }));

export default router;
