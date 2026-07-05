import Notification from '../models/Notification.js';

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });

    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markTypeAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { type } = req.body;
    
    await Notification.updateMany(
      { recipient: userId, type: type, isRead: false },
      { $set: { isRead: true } }
    );
    
    res.status(200).json({ message: `Unread ${type} notifications marked as read` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};