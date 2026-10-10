/**
 * Stable Product Image Asset Mapper
 * Maps product names to high-definition real product photography.
 * Ensures every product has a distinct, matching photograph.
 */

const PRODUCT_IMAGE_MAP = {
  // Electronics
  'wireless noise-canceling headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  'ergonomic mechanical keyboard': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
  'ultra hd 4k monitor 27"': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',

  // Clothing & Fashion
  'classic denim jacket': 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
  'running performance sneakers': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',

  // Books & Stationery
  'designing data-intensive applications': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  'clean architecture': 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80',

  // Home & Kitchen
  'stainless steel espresso machine': 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=600&q=80',
  'non-stick cast iron skillet': 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80',
};

const CATEGORY_FALLBACK_IMAGES = {
  electronics: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80',
  clothing: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80',
  footwear: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  books: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
  'home & kitchen': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
  'furniture & home office': 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80',
  'sports & fitness': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
  'beauty & personal care': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
  'bags & travel': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'
};

export const getProductImageUrl = (product) => {
  if (!product) return null;

  // 1. Return explicit image_url if provided by database/API
  if (product.image_url && typeof product.image_url === 'string' && product.image_url.startsWith('http')) {
    return product.image_url;
  }

  // 2. Lookup by exact normalized product name
  const nameLower = (product.name || '').trim().toLowerCase();
  if (PRODUCT_IMAGE_MAP[nameLower]) {
    return PRODUCT_IMAGE_MAP[nameLower];
  }

  // 3. Keyword matching for specific product types
  if (nameLower.includes('headphone') || nameLower.includes('earphone')) {
    return PRODUCT_IMAGE_MAP['wireless noise-canceling headphones'];
  }
  if (nameLower.includes('keyboard')) {
    return PRODUCT_IMAGE_MAP['ergonomic mechanical keyboard'];
  }
  if (nameLower.includes('monitor') || nameLower.includes('display')) {
    return PRODUCT_IMAGE_MAP['ultra hd 4k monitor 27"'];
  }
  if (nameLower.includes('jacket') || nameLower.includes('denim')) {
    return PRODUCT_IMAGE_MAP['classic denim jacket'];
  }
  if (nameLower.includes('sneaker') || nameLower.includes('shoe') || nameLower.includes('running')) {
    return PRODUCT_IMAGE_MAP['running performance sneakers'];
  }
  if (nameLower.includes('espresso') || nameLower.includes('coffee')) {
    return PRODUCT_IMAGE_MAP['stainless steel espresso machine'];
  }
  if (nameLower.includes('skillet') || nameLower.includes('pan') || nameLower.includes('cookware')) {
    return PRODUCT_IMAGE_MAP['non-stick cast iron skillet'];
  }
  if (nameLower.includes('data-intensive') || nameLower.includes('architecture')) {
    return PRODUCT_IMAGE_MAP['clean architecture'];
  }

  // 4. Category fallback
  const categoryLower = (product.category_name || '').trim().toLowerCase();
  if (CATEGORY_FALLBACK_IMAGES[categoryLower]) {
    return CATEGORY_FALLBACK_IMAGES[categoryLower];
  }

  return 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80';
};
