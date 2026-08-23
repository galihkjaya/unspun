export const DEMO_QUERIES = [
  "best air purifier for small room",
  "mechanical keyboard under $100",
  "budget robot vacuum",
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
