// Gate a route to administrators. Must run after `protect` (which sets req.user).
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
