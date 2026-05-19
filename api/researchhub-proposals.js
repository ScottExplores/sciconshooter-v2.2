const https = require('https');

const RESEARCHHUB_FUNDING_FEED =
  'https://backend.prod.researchhub.com/api/funding_feed/?fundraise_status=OPEN&ordering=best&page_size=20&content_type=PREREGISTRATION';
const MAX_PROPOSAL_PAGES = 5;
const MAX_PROPOSALS = 100;

const sendJson = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(payload));
};

const requestJsonWithRelaxedCert = (url) => new Promise((resolve, reject) => {
  const request = https.request(
    new URL(url),
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SciconShooter/1.0 (+https://sciconshooter.xyz)'
      },
      // ResearchHub's public backend can present an incomplete chain to Node.
      // This is a read-only proxy for public proposal data, so we only relax it here.
      rejectUnauthorized: false
    },
    (response) => {
      let body = '';

      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`ResearchHub funding feed returned ${response.statusCode}`));
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    }
  );

  request.on('error', reject);
  request.end();
});

const fetchResearchHubFeedPage = async (url) => {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SciconShooter/1.0 (+https://sciconshooter.xyz)'
      }
    });

    if (!response.ok) {
      throw new Error(`ResearchHub funding feed returned ${response.status}`);
    }

    return response.json();
  } catch (error) {
    const message = error?.cause?.code || error?.message || '';
    if (!/CERT|certificate|UNABLE_TO_VERIFY/i.test(message)) {
      throw error;
    }

    return requestJsonWithRelaxedCert(url);
  }
};

const fetchResearchHubFeed = async () => {
  let nextUrl = RESEARCHHUB_FUNDING_FEED;
  let firstPayload = null;
  const results = [];

  for (let page = 0; nextUrl && page < MAX_PROPOSAL_PAGES && results.length < MAX_PROPOSALS; page += 1) {
    const payload = await fetchResearchHubFeedPage(nextUrl);
    if (!firstPayload) {
      firstPayload = payload;
    }

    if (Array.isArray(payload?.results)) {
      results.push(...payload.results.slice(0, MAX_PROPOSALS - results.length));
    }

    nextUrl = typeof payload?.next === 'string' ? payload.next : null;
  }

  return {
    ...(firstPayload || {}),
    next: nextUrl,
    results
  };
};

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const payload = await fetchResearchHubFeed();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
    return sendJson(res, 200, payload);
  } catch (error) {
    console.error('ResearchHub proposals API error:', error);
    return sendJson(res, 502, {
      error: 'ResearchHub proposal feed is unavailable',
      details: error.message
    });
  }
};
