// scripts/make-paid.js
// Usage: node scripts/make-paid.js <userId> [status]
// Example: node scripts/make-paid.js 4 active

const models = require('../src/models');

async function main() {
  const userId = process.argv[2];
  const status = process.argv[3] || 'active';
  if (!userId) {
    console.error('Usage: node scripts/make-paid.js <userId> [status]');
    process.exit(1);
  }

  await models.sequelize.authenticate();

  // create a Billing row. Adjust fields if your Billing model requires different attrs.
  const billing = await models.Billing.create({
    userId: Number(userId),
    status,
    // optional fields - adjust to your model if necessary:
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  });

  console.log('Created billing record:', billing.toJSON());
  await models.sequelize.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
