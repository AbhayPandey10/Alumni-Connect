import Connection from '../models/Connection.js';
import User from '../models/User.js';
import { createNotification } from '../services/notificationService.js';

const nameOf = (u) => (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u?.username || 'Someone'));
const meId = (req) => String(req.user.id || req.user._id);

// POST /api/connections/request  { recipientId }
export const sendConnectionRequest = async (req, res) => {
  try {
    const me = meId(req);
    const { recipientId } = req.body;
    if (!recipientId) return res.status(400).json({ message: 'recipientId is required' });
    if (String(recipientId) === me) return res.status(400).json({ message: 'You cannot connect with yourself' });

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: 'User not found' });

    // Any existing record between the two (either direction)
    let conn = await Connection.findOne({
      $or: [{ requester: me, recipient: recipientId }, { requester: recipientId, recipient: me }],
    });

    if (conn) {
      if (conn.status === 'accepted') return res.status(400).json({ message: 'You are already connected' });
      if (conn.status === 'pending') return res.status(400).json({ message: 'A request is already pending' });
      // Previously rejected — re-open as a fresh request from me
      conn.requester = me;
      conn.recipient = recipientId;
      conn.status = 'pending';
      await conn.save();
    } else {
      conn = await Connection.create({ requester: me, recipient: recipientId, status: 'pending' });
    }

    createNotification({
      recipient: recipientId,
      type: 'Connection',
      title: 'New connection request',
      message: `${nameOf(req.user)} wants to connect with you.`,
      actionUrl: '/connections',
      relatedEntityModel: 'Connection',
      relatedEntityId: conn._id,
    }).catch((e) => console.error('Connection notify failed:', e.message));

    res.status(201).json(conn);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/connections/:id/respond  { action: 'accept' | 'reject' }
export const respondToRequest = async (req, res) => {
  try {
    const me = meId(req);
    const { action } = req.body;
    const conn = await Connection.findById(req.params.id);
    if (!conn) return res.status(404).json({ message: 'Request not found' });
    if (String(conn.recipient) !== me) return res.status(403).json({ message: 'Not authorized' });
    if (conn.status !== 'pending') return res.status(400).json({ message: 'This request is no longer pending' });

    conn.status = action === 'accept' ? 'accepted' : 'rejected';
    await conn.save();

    if (conn.status === 'accepted') {
      createNotification({
        recipient: conn.requester,
        type: 'Connection',
        title: 'Connection accepted',
        message: `${nameOf(req.user)} accepted your connection request.`,
        actionUrl: '/connections',
        relatedEntityModel: 'Connection',
        relatedEntityId: conn._id,
      }).catch((e) => console.error('Connection notify failed:', e.message));
    }

    res.status(200).json(conn);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/connections  — my accepted connections
export const getMyConnections = async (req, res) => {
  try {
    const me = meId(req);
    const conns = await Connection.find({ status: 'accepted', $or: [{ requester: me }, { recipient: me }] })
      .populate('requester recipient', 'firstName lastName username email role')
      .sort({ updatedAt: -1 });

    const list = conns.map((c) => {
      const other = String(c.requester._id) === me ? c.recipient : c.requester;
      return { connectionId: c._id, user: other, since: c.updatedAt };
    });
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/connections/pending — incoming requests awaiting my response
export const getPendingRequests = async (req, res) => {
  try {
    const me = meId(req);
    const incoming = await Connection.find({ recipient: me, status: 'pending' })
      .populate('requester', 'firstName lastName username email role')
      .sort({ createdAt: -1 });
    res.status(200).json(incoming.map((c) => ({ connectionId: c._id, user: c.requester, createdAt: c.createdAt })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/connections/status/:userId — relationship between me and another user
export const getConnectionStatus = async (req, res) => {
  try {
    const me = meId(req);
    const other = req.params.userId;
    if (String(other) === me) return res.status(200).json({ status: 'self' });

    const conn = await Connection.findOne({
      $or: [{ requester: me, recipient: other }, { requester: other, recipient: me }],
    });
    if (!conn || conn.status === 'rejected') return res.status(200).json({ status: 'none' });
    if (conn.status === 'accepted') return res.status(200).json({ status: 'connected', connectionId: conn._id });
    // pending
    return res.status(200).json({
      status: String(conn.requester) === me ? 'pending_outgoing' : 'pending_incoming',
      connectionId: conn._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/connections/:id — remove a connection or withdraw a request (either party)
export const removeConnection = async (req, res) => {
  try {
    const me = meId(req);
    const conn = await Connection.findById(req.params.id);
    if (!conn) return res.status(404).json({ message: 'Not found' });
    if (![String(conn.requester), String(conn.recipient)].includes(me)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await conn.deleteOne();
    res.status(200).json({ message: 'Connection removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
