const {
  archiveMonthlyWinner,
  getPreviousMonthKey,
  isAuthorized,
  sendJson
} = require('./monthlyWinnerService');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  if (!isAuthorized(req)) {
    return sendJson(res, 401, { error: 'Unauthorized' });
  }

  try {
    const result = await archiveMonthlyWinner(getPreviousMonthKey());
    return sendJson(res, 200, result);
  } catch (error) {
    console.error('Monthly archive cron error:', error);
    return sendJson(res, 500, {
      error: 'Monthly winner archive failed',
      details: error.message
    });
  }
};
