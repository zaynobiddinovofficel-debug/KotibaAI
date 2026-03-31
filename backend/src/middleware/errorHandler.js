module.exports = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (err.stack) console.error(err.stack);
  res.status(500).json({ error: 'Serverda xatolik yuz berdi', detail: err.message });
};
