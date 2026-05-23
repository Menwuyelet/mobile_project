/**
 * Advanced Item Matching Engine
 * Used to suggest potential matches between Lost and Found reports
 */

const tokenize = (text = '') => 
  text
    .toLowerCase()
    .trim()
    .split(/\W+/)
    .filter(Boolean);

const COLOR_TOKENS = new Set([
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
  'pink', 'brown', 'gray', 'grey', 'silver', 'gold', 'beige', 'navy',
  'maroon', 'teal', 'cyan', 'cream',
]);

/**
 * Calculates token overlap similarity (Jaccard-like)
 */
const overlapScore = (textA = '', textB = '') => {
  if (!textA || !textB) return 0;

  const tokensA = new Set(tokenize(textA));
  const tokensB = new Set(tokenize(textB));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  tokensA.forEach(token => {
    if (tokensB.has(token)) intersection++;
  });

  return intersection / Math.max(tokensA.size, tokensB.size);
};

const colorMatchScore = (itemA = {}, itemB = {}) => {
  const aText = `${itemA.title || ''} ${itemA.description || ''}`;
  const bText = `${itemB.title || ''} ${itemB.description || ''}`;

  const colorsA = new Set(tokenize(aText).filter(token => COLOR_TOKENS.has(token)));
  const colorsB = new Set(tokenize(bText).filter(token => COLOR_TOKENS.has(token)));

  if (!colorsA.size || !colorsB.size) return 0;

  let overlap = 0;
  colorsA.forEach(token => {
    if (colorsB.has(token)) overlap += 1;
  });

  return overlap / Math.max(colorsA.size, colorsB.size);
};

/**
 * Haversine formula - calculates distance in kilometers
 */
const distanceKm = (locA, locB) => {
  const hasValidA = Number.isFinite(locA?.latitude) && Number.isFinite(locA?.longitude);
  const hasValidB = Number.isFinite(locB?.latitude) && Number.isFinite(locB?.longitude);
  if (!hasValidA || !hasValidB) {
    return 999; // Very far (invalid location)
  }

  const d2r = Math.PI / 180;
  const r = 6371; // Earth radius in km

  const dLat = (locB.latitude - locA.latitude) * d2r;
  const dLon = (locB.longitude - locA.longitude) * d2r;
  const lat1 = locA.latitude * d2r;
  const lat2 = locB.latitude * d2r;

  const a = 
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * 
    Math.cos(lat1) * Math.cos(lat2);

  return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Calculate similarity score between a lost item and a found item
 * Returns a score between 0 and 1
 */
export const calculateMatchScore = (lostItem, foundItem) => {
  if (!lostItem || !foundItem) return 0;

  let score = 0;

  // 1. Category Match (High importance)
  if (lostItem.category?.toLowerCase() === foundItem.category?.toLowerCase()) {
    score += 0.25;
  }

  // 2. Title Similarity (Very High importance)
  const titleScore = overlapScore(lostItem.title, foundItem.title);
  score += titleScore * 0.30;

  // 3. Description Similarity
  const descScore = overlapScore(lostItem.description, foundItem.description);
  score += descScore * 0.20;

  // 4. Color similarity from title/description
  const colorScore = colorMatchScore(lostItem, foundItem);
  score += colorScore * 0.10;

  // 5. Location Proximity
  const distance = distanceKm(lostItem.location, foundItem.location);
  
  if (distance <= 0.5) score += 0.10;           // Very close
  else if (distance <= 2) score += 0.05;        // Nearby
  else if (distance <= 5) score += 0.02;        // Moderate

  // Bonus: Same campus (if available)
  if (lostItem.campus && foundItem.campus && 
      lostItem.campus.toLowerCase() === foundItem.campus.toLowerCase()) {
    score += 0.05;
  }

  return Number(Math.min(1, score).toFixed(2));
};

export default calculateMatchScore;
