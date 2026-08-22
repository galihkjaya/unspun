export const DEMO_QUERIES = [
  "best air purifier for small room",
  "mechanical keyboard under $100",
  "budget robot vacuum",
] as const;

// Real pipeline characteristics, not marketing numbers:
// - cold start: measured 4-8s for an uncached SerpAPI scrape + synthesis
// - repeat: served from the 24h localStorage cache, no network
// - blocked: AFFILIATE_BLACKLIST in api/services/bias_detector.py
export const STATS = [
  { icon: "⚡", value: "~6.5s", label: "cold start" },
  { icon: "🔁", value: "0ms", label: "on repeat" },
  { icon: "🚫", value: "8", label: "affiliate networks blocked" },
] as const;

export const GOOGLE_RESULTS = [
  { rank: 1, source: 'Forbes "10 Best Air Purifiers"' },
  { rank: 2, source: 'CNET "Top Picks Tested"' },
  { rank: 3, source: 'BHG "We Tested 30 Models"' },
] as const;

export const STEPS = [
  { n: "①", title: "Strip", body: "Remove 8+ affiliate publishers from organic results" },
  { n: "②", title: "Read", body: "Scan Reddit consensus in real-time via SerpAPI" },
  { n: "③", title: "Price", body: "Cross-check live shopping data for ground truth" },
] as const;
