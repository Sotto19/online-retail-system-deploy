import jwt from 'jsonwebtoken';
import pool, { isDbConnected, mockData } from '../config/db.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'retail_super_secret_jwt_key_2026');

    if (isDbConnected()) {
      const [rows] = await pool.query('SELECT id, name, email, role, status FROM users WHERE id = ?', [decoded.id]);
      if (rows.length === 0 || rows[0].status !== 'active') {
        return res.status(401).json({ success: false, message: 'User not found or inactive.' });
      }
      req.user = rows[0];
    } else {
      const user = mockData.users.find(u => u.id === decoded.id);
      if (!user || user.status !== 'active') {
        return res.status(401).json({ success: false, message: 'User not found or inactive.' });
      }
      req.user = { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
  next();
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'retail_super_secret_jwt_key_2026');
      if (isDbConnected()) {
        const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
        if (rows.length > 0) req.user = rows[0];
      } else {
        const user = mockData.users.find(u => u.id === decoded.id);
        if (user) req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
      }
    }
  } catch (err) {
    // Optional, ignore error
  }
  next();
};
