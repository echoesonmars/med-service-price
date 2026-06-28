const { PrismaClient } = require('@prisma/client');
const path = require('path');

const dbPath = path.resolve(__dirname, 'prisma', 'dev.db');
console.log('Resolved DB path:', dbPath);
console.log('DB exists:', require('fs').existsSync(dbPath));

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:' + dbPath
    }
  }
});

prisma.service.count()
  .then(c => console.log('Success! Count:', c))
  .catch(e => console.error('Error:', e.message))
  .finally(() => prisma.$disconnect());
