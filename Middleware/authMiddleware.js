const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;
  // Check karo ki header mein token hai ya nahi
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'CYBER_NEXUS_CORE_SECRET');
      
      req.student = decoded; // Student ki ID request mein save ho gayi
      next();
    } catch (error) {
      return res.status(401).json({ success: false, msg: "SESSION_EXPIRED: Token Invalid" });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, msg: "NOT_AUTHORIZED: No Token" });
  }
};

module.exports = { protect };