const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$connect()
  .then(() => { console.log('DB OK'); return p.$disconnect(); })
  .catch(e => { console.error('DB ERROR:', e.message); process.exit(1); });
