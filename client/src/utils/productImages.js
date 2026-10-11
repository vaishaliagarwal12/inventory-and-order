/**
 * Stable Product Image Asset Mapper
 * Maps product names to high-definition real product photography.
 * Ensures every product has a distinct, matching photograph across all 9 categories.
 */

const PRODUCT_IMAGE_MAP = {
  // ==========================================
  // 1. ELECTRONICS (6 Products)
  // ==========================================
  'wireless noise-canceling headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  'ergonomic mechanical keyboard': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
  'ultra hd 4k monitor 27"': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
  'compact wireless bluetooth speaker': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80',
  'usb-c multi-port hub adapter': 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&w=600&q=80',
  'smart fitness tracker wristband': 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=600&q=80',

  // ==========================================
  // 2. CLOTHING (6 Products)
  // ==========================================
  'classic denim jacket': 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
  'merino wool crewneck sweater': 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=80',
  'slim-fit chino trousers': 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=600&q=80',
  'organic cotton oxford shirt': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
  'weatherproof hooded rain parka': 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80',
  'heavyweight cotton crew t-shirt': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',

  // ==========================================
  // 3. FOOTWEAR (6 Products)
  // ==========================================
  'running performance sneakers': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  'classic canvas low-top sneakers': 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=600&q=80',
  'full-grain leather chelsea boots': 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=600&q=80',
  'all-terrain trail hiking shoes': 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=600&q=80',
  'cushioned suede driving loafers': 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80',
  'supportive cross-training shoes': 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80',

  // ==========================================
  // 4. BOOKS (6 Products)
  // ==========================================
  'designing data-intensive applications': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  'clean architecture': 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80',
  'the pragmatic programmer': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
  'site reliability engineering': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
  'modern database systems & sql': 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80',
  'domain-driven design principles': 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80',

  // ==========================================
  // 5. HOME & KITCHEN (6 Products)
  // ==========================================
  'stainless steel espresso machine': 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=600&q=80',
  'non-stick cast iron skillet': 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80',
  'precision electric gooseneck kettle': 'https://images.unsplash.com/photo-1594213114663-ddf4f240f08d?auto=format&fit=crop&w=600&q=80',
  'japanese high-carbon chef knife 8"': 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=600&q=80',
  'organic bamboo food prep cutting board': 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=600&q=80',
  'airtight glass food storage containers': 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',

  // ==========================================
  // 6. FURNITURE & HOME OFFICE (6 Products)
  // ==========================================
  'ergonomic mesh swivel office chair': 'https://images.unsplash.com/photo-1580481077195-c22ae4534720?auto=format&fit=crop&w=600&q=80',
  'motorized standing desk 55"': 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80',
  'architect led task desk lamp': 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=600&q=80',
  'solid wood monitor riser stand': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
  'mobile 3-drawer under-desk filing cabinet': 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80',
  'ergonomic footrest with rocking function': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',

  // ==========================================
  // 7. SPORTS & FITNESS (6 Products)
  // ==========================================
  'adjustable quick-select dumbbell pair': 'https://images.unsplash.com/photo-1586401100295-7a8096fd231a?auto=format&fit=crop&w=600&q=80',
  'high-density non-slip yoga mat 6mm': 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=600&q=80',
  'heavy-duty resistance loop bands set': 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=600&q=80',
  'cast iron competition kettlebell 16kg': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
  'insulated stainless steel gym water bottle': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
  'speed cable jump rope with ball bearings': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',

  // ==========================================
  // 8. BEAUTY & PERSONAL CARE (6 Products)
  // ==========================================
  'hydrating botanical face serum 30ml': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
  'sonic electric toothbrush with travel case': 'https://images.unsplash.com/photo-1559591937-e1032c525f23?auto=format&fit=crop&w=600&q=80',
  'cold-pressed jojoba & argan hair oil': 'https://images.unsplash.com/photo-1608248597359-0062a4b88ba8?auto=format&fit=crop&w=600&q=80',
  'natural shea butter body cream 200g': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
  'rechargeable men precision beard trimmer': 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80',
  'mineral sunscreen lotion spf 50': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',

  // ==========================================
  // 9. BAGS & TRAVEL (6 Products)
  // ==========================================
  'water-resistant commuter laptop backpack 20l': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
  'expandable carry-on hardside spinner 21"': 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=600&q=80',
  'canvas weekender duffel overnight bag': 'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=600&q=80',
  'rfid-blocking leather bifold wallet': 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80',
  'waterproof hanging toiletries travel kit': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80',
  'ultra-light packable crossbody sling bag': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80'
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
  if (nameLower.includes('data-intensive')) {
    return PRODUCT_IMAGE_MAP['designing data-intensive applications'];
  }
  if (nameLower.includes('clean architecture') || nameLower.includes('pragmatic') || nameLower.includes('site reliability')) {
    return PRODUCT_IMAGE_MAP['clean architecture'];
  }

  // 4. Category fallback
  const categoryLower = (product.category_name || '').trim().toLowerCase();
  if (CATEGORY_FALLBACK_IMAGES[categoryLower]) {
    return CATEGORY_FALLBACK_IMAGES[categoryLower];
  }

  return 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80';
};
