// debug_services.js
const models = require('./src/models');
const { sequelize } = models;
const { QueryTypes } = require('sequelize');

(async () => {
  try {
    const rows = await models.Service.findAll({
      attributes: ['id','userId','title','description','price','createdAt','updatedAt'],
      include: [{ model: models.User, as: 'owner', attributes: ['id','username'] }],
      order: [['createdAt','DESC']],
      limit: 20
    });
    console.log('ROWS:', JSON.stringify(rows.map(r => r.toJSON()), null, 2));

    const serviceIds = rows.map(r => r.id);
    console.log('serviceIds:', serviceIds);

    const rowsRaw = await sequelize.query(
      'SELECT "service_id" AS "serviceId", AVG(COALESCE(stars, score))::numeric(10,2) AS "avgRating", COUNT(*)::int AS "ratingsCount" FROM ratings WHERE "service_id" IS NOT NULL AND "service_id" IN (:ids) GROUP BY "service_id"',
      { replacements: { ids: serviceIds }, type: QueryTypes.SELECT }
    );
    console.log('AGG:', JSON.stringify(rowsRaw, null, 2));
  } catch (e) {
    console.error('ERROR:', e && e.stack ? e.stack : e);
  } finally {
    try { await sequelize.close(); } catch (e) {}
    process.exit();
  }
})();
