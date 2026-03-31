const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId || decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Noto\'g\'ri token' });
  }
};
