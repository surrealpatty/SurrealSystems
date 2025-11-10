// scripts/make-unpaid.js
// Usage: node scripts/make-unpaid.js <userId>
// Example: node scripts/make-unpaid.js 4

const models = require('../src/models');

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Usage: node scripts/make-unpaid.js <userId>');
    process.exit(1);
  }

  await models.sequelize.authenticate();

  const record = await models.Billing.findOne({ where: { userId: Number(userId) } });
  if (!record) {
    console.log('No billing record found for userId', userId);
    await models.sequelize.close();
    process.exit(0);
  }

  // Option A: delete the record
  await record.destroy();
  console.log('Deleted billing record for userId', userId);

  // Option B (alternative): set status to "cancelled"
  // await record.update({ status: 'cancelled' });

  await models.sequelize.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
