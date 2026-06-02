import { DONATION_CONFIG } from '../constants';

const getDexScreenerTokenUrl = (tokenAddress: string) => (
  `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
);

const DEXSCREENER_RSC_URL = getDexScreenerTokenUrl(DONATION_CONFIG.RSC_CONTRACT_ADDRESS);
const DEXSCREENER_KARMA_URL = getDexScreenerTokenUrl(DONATION_CONFIG.KARMA_CONTRACT_ADDRESS);

type DexScreenerPair = {
  chainId?: string;
  priceUsd?: string;
  url?: string;
  liquidity?: {
    usd?: number;
  };
  priceChange?: {
    h24?: number;
  };
};

export interface RscMarketPrice {
  priceUsd: number;
  priceChange24h?: number;
  sourceUrl?: string;
  updatedAt: string;
}

const isFiniteNumber = (value: unknown): value is number => (
  typeof value === 'number' && Number.isFinite(value)
);

const parsePrice = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const pickBestBasePair = (pairs: DexScreenerPair[]) => {
  const basePairs = pairs.filter((pair) => pair.chainId?.toLowerCase() === 'base');
  const candidates = basePairs.length > 0 ? basePairs : pairs;

  return candidates
    .filter((pair) => parsePrice(pair.priceUsd) !== undefined)
    .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
};

const pickBestChainPair = (pairs: DexScreenerPair[], chainId: string) => {
  const chainPairs = pairs.filter((pair) => pair.chainId?.toLowerCase() === chainId.toLowerCase());
  const candidates = chainPairs.length > 0 ? chainPairs : pairs;

  return candidates
    .filter((pair) => parsePrice(pair.priceUsd) !== undefined)
    .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
};

const getTokenMarketPrice = async (url: string, chainId: string, label: string): Promise<RscMarketPrice> => {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`${label} market price returned ${response.status}`);
  }

  const payload = await response.json();
  const pairs = Array.isArray(payload?.pairs) ? payload.pairs as DexScreenerPair[] : [];
  const bestPair = chainId === 'base' ? pickBestBasePair(pairs) : pickBestChainPair(pairs, chainId);
  const priceUsd = parsePrice(bestPair?.priceUsd);

  if (!bestPair || priceUsd === undefined) {
    throw new Error(`${label} market price unavailable`);
  }

  return {
    priceUsd,
    priceChange24h: isFiniteNumber(bestPair.priceChange?.h24) ? bestPair.priceChange?.h24 : undefined,
    sourceUrl: bestPair.url,
    updatedAt: new Date().toISOString()
  };
};

export const getRscMarketPrice = () => (
  getTokenMarketPrice(DEXSCREENER_RSC_URL, 'base', 'RSC')
);

export const getKarmaMarketPrice = () => (
  getTokenMarketPrice(DEXSCREENER_KARMA_URL, 'bsc', 'KRMA')
);

export const formatRscPrice = (priceUsd?: number) => {
  if (!isFiniteNumber(priceUsd)) return '--';
  if (priceUsd >= 1) return `$${priceUsd.toFixed(2)}`;
  if (priceUsd >= 0.01) return `$${priceUsd.toFixed(3)}`;
  return `$${priceUsd.toFixed(4)}`;
};

export const formatRscPriceChange = (change?: number) => {
  if (!isFiniteNumber(change)) return null;
  const prefix = change > 0 ? '+' : '';
  return `${prefix}${change.toFixed(1)}%`;
};
