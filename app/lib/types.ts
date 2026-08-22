// Mirrors api/services/schemas.py (Pydantic serializes to camelCase).

export type Sentiment = "positive" | "mixed" | "negative";

export interface QuarantinedDomain {
  domain: string;
  reason: string;
}

export interface Recommendation {
  rank: number;
  name: string;
  mentions: number;
  sentiment: Sentiment;
  communityQuote: string;
  caveat: string;
  price: number;
  buyUrl: string;
}

export interface SearchResult {
  query: string;
  summary: string;
  quarantined: QuarantinedDomain[];
  recommendations: Recommendation[];
  savings: number;
  astroturfFlags: string[];
  timestamp: string;
}

export interface SearchHistoryEntry {
  id: string;
  query: string;
  timestamp: string;
  result: SearchResult;
}

export const HISTORY_KEY = "search_history";
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_QUERY = "best air purifier for small room";
