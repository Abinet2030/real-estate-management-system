import express from 'express';
import Inquiry from '../models/Inquiry.js';
import InquiryMessage from '../models/InquiryMessage.js';

const router = express.Router();

// GET /api/inquiries?ownerId=... OR ?buyerEmail=... OR ?all=1 (admin)
router.get('/', async (req, res) => {
  try {
    const { ownerId, buyerEmail, all } = req.query || {};
    let filter = null;
    if (all === '1' || all === 1 || all === true || all === 'true') {
      filter = {};
    } else if (buyerEmail) {
      filter = { buyerEmail };
    } else if (ownerId) {
      filter = { ownerId };
    } else {
      return res.status(400).json({ error: 'ownerId or buyerEmail is required' });
    }
    const items = await Inquiry.find(filter).sort({ lastActivityAt: -1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('GET /inquiries error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/inquiries/:id - returns inquiry and messages
router.get('/:id', async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ error: 'Not found' });
    const messages = await InquiryMessage.find({ inquiryId: inquiry._id }).sort({ createdAt: 1 });
    res.json({ inquiry, messages });
  } catch (err) {
    console.error('GET /inquiries/:id error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/inquiries - public create (supports initial message and attachments)
router.post('/', async (req, res) => {
  try {
    const { propertyId, ownerId, buyerId, buyerName, buyerEmail, message, attachments } = req.body || {};
    if (!propertyId || !ownerId || !buyerName || !buyerEmail) return res.status(400).json({ error: 'Missing fields' });
    const hasText = !!message && typeof message === 'string';
    const files = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
    // Reuse an existing inquiry thread for this buyer/property/owner if it exists
    let inquiry = await Inquiry.findOne({ propertyId, ownerId, buyerEmail });
    if (!inquiry) {
      inquiry = await Inquiry.create({
        propertyId,
        ownerId,
        buyerId: buyerId || undefined,
        buyerName,
        buyerEmail,
        lastActivityAt: new Date(),
        ownerUnreadCount: (hasText || files.length > 0) ? 1 : 0,
      });
      if (hasText || files.length > 0) {
        await InquiryMessage.create({ inquiryId: inquiry._id, sender: 'buyer', text: hasText ? message : '', attachments: files });
      }
    } else if (hasText || files.length > 0) {
      await InquiryMessage.create({ inquiryId: inquiry._id, sender: 'buyer', text: hasText ? message : '', attachments: files });
      inquiry.lastActivityAt = new Date();
      inquiry.ownerUnreadCount = (inquiry.ownerUnreadCount || 0) + 1;
      await inquiry.save();
    }
    res.status(201).json({ inquiryId: inquiry._id });
  } catch (err) {
    console.error('POST /inquiries error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/inquiries/:id/messages - owner reply
router.post('/:id/messages', async (req, res) => {
  try {
    const { text = '', attachments = [], sender = 'owner' } = req.body || {};
    if (!text && (!Array.isArray(attachments) || attachments.length === 0)) {
      return res.status(400).json({ error: 'text or attachments required' });
    }
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ error: 'Not found' });
    await InquiryMessage.create({ inquiryId: inquiry._id, sender, text, attachments });
    inquiry.lastActivityAt = new Date();
    if (sender === 'buyer') inquiry.ownerUnreadCount = (inquiry.ownerUnreadCount || 0) + 1;
    if (sender === 'owner') inquiry.buyerUnreadCount = (inquiry.buyerUnreadCount || 0) + 1;
    await inquiry.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /inquiries/:id/messages error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/inquiries/:id/archive
router.post('/:id/archive', async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ error: 'Not found' });
    inquiry.status = 'archived';
    await inquiry.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /inquiries/:id/archive error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/inquiries/:id/read  { role: 'buyer' | 'owner' }
router.post('/:id/read', async (req, res) => {
  try {
    const { role } = req.body || {};
    if (!role || !['buyer','owner'].includes(role)) return res.status(400).json({ error: 'role is required' });
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ error: 'Not found' });
    const now = new Date();
    if (role === 'buyer') { inquiry.buyerUnreadCount = 0; inquiry.buyerLastReadAt = now; }
    if (role === 'owner') { inquiry.ownerUnreadCount = 0; inquiry.ownerLastReadAt = now; }
    await inquiry.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /inquiries/:id/read error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
