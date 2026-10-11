import { pool } from '../config/db.js';
import { cleanupTestData } from './cleanup_test_data.js';

/**
 * Phase 3B - Realistic ShopFlow Product Catalog Seeder
 * Idempotent, safe, and repeatable database catalog seeding script.
 *
 * Populates 54 realistic products across the 9 existing store categories:
 * 1. Electronics
 * 2. Clothing
 * 3. Footwear
 * 4. Books
 * 5. Home & Kitchen
 * 6. Furniture & Home Office
 * 7. Sports & Fitness
 * 8. Beauty & Personal Care
 * 9. Bags & Travel
 *
 * Rules:
 * - Dynamically binds to real category IDs in PostgreSQL.
 * - Idempotent: checks for existing products by name and avoids duplicates.
 * - Preserves existing stock, historical orders, and user records.
 * - Inserts inventory records and audit ledger movements for newly seeded items.
 */

const CATALOG_DATA = [
  // ==========================================
  // 1. ELECTRONICS (6 Products)
  // ==========================================
  {
    categoryName: 'Electronics',
    name: 'Wireless Noise-Canceling Headphones',
    description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and plush memory foam earcups.',
    price: 299.99,
    initialStock: 46
  },
  {
    categoryName: 'Electronics',
    name: 'Ergonomic Mechanical Keyboard',
    description: 'RGB backlight tactile mechanical switch keyboard with customizable hot-swappable keys and aluminum chassis.',
    price: 129.50,
    initialStock: 34
  },
  {
    categoryName: 'Electronics',
    name: 'Ultra HD 4K Monitor 27"',
    description: 'IPS display monitor with HDR support, 99% sRGB color accuracy, and ultra-slim bezel design for dual-screen setups.',
    price: 349.00,
    initialStock: 20
  },
  {
    categoryName: 'Electronics',
    name: 'Compact Wireless Bluetooth Speaker',
    description: 'Portable cylindrical Bluetooth speaker with IPX7 water resistance, 360-degree sound, and 14-hour continuous playtime.',
    price: 59.99,
    initialStock: 45
  },
  {
    categoryName: 'Electronics',
    name: 'USB-C Multi-Port Hub Adapter',
    description: 'Aluminum 7-in-1 USB-C adapter hub featuring 4K HDMI, SD/TF card readers, dual USB 3.0 ports, and 100W Power Delivery.',
    price: 39.99,
    initialStock: 60
  },
  {
    categoryName: 'Electronics',
    name: 'Smart Fitness Tracker Wristband',
    description: 'Lightweight fitness tracking smartband with AMOLED touch display, 24/7 heart-rate monitoring, and water-resistant casing.',
    price: 89.00,
    initialStock: 40
  },

  // ==========================================
  // 2. CLOTHING (6 Products)
  // ==========================================
  {
    categoryName: 'Clothing',
    name: 'Classic Denim Jacket',
    description: '100% durable cotton denim jacket tailored in a timeless casual fit with brass shank buttons and chest flap pockets.',
    price: 79.99,
    initialStock: 100
  },
  {
    categoryName: 'Clothing',
    name: 'Merino Wool Crewneck Sweater',
    description: 'Fine-knit 100% Australian merino wool crewneck sweater with ribbed cuffs and hem for lightweight, breathable warmth.',
    price: 88.00,
    initialStock: 45
  },
  {
    categoryName: 'Clothing',
    name: 'Slim-Fit Chino Trousers',
    description: 'Stretch cotton twill chino trousers tailored for everyday comfort with clean flat front styling and welt back pockets.',
    price: 54.50,
    initialStock: 55
  },
  {
    categoryName: 'Clothing',
    name: 'Organic Cotton Oxford Shirt',
    description: 'Classic button-down long-sleeve oxford shirt crafted from pre-washed breathable organic cotton for business and casual wear.',
    price: 48.00,
    initialStock: 65
  },
  {
    categoryName: 'Clothing',
    name: 'Weatherproof Hooded Rain Parka',
    description: 'Lightweight water-resistant shell jacket with fully taped seams, adjustable drawcord hood, and zippered storm pockets.',
    price: 119.00,
    initialStock: 30
  },
  {
    categoryName: 'Clothing',
    name: 'Heavyweight Cotton Crew T-Shirt',
    description: 'Durable 220 GSM combed cotton crewneck t-shirt with reinforced double-needle collar and pre-shrunk soft-touch finish.',
    price: 26.00,
    initialStock: 80
  },

  // ==========================================
  // 3. FOOTWEAR (6 Products)
  // ==========================================
  {
    categoryName: 'Footwear',
    name: 'Running Performance Sneakers',
    description: 'Lightweight breathable mesh athletic shoes with responsive foam cushioning and high-wear rubber outsole pods.',
    price: 110.00,
    initialStock: 75
  },
  {
    categoryName: 'Footwear',
    name: 'Classic Canvas Low-Top Sneakers',
    description: 'Timeless low-cut vulcanized rubber sole sneakers featuring heavy-gauge breathable canvas upper and metal eyelets.',
    price: 55.00,
    initialStock: 70
  },
  {
    categoryName: 'Footwear',
    name: 'Full-Grain Leather Chelsea Boots',
    description: 'Hand-finished pull-on leather boots featuring elastic side gussets, Goodyear welted construction, and durable rubber soles.',
    price: 165.00,
    initialStock: 28
  },
  {
    categoryName: 'Footwear',
    name: 'All-Terrain Trail Hiking Shoes',
    description: 'Rugged trail walking shoes with high-traction lugged rubber outsoles, reinforced TPU toe bumpers, and moisture-wicking lining.',
    price: 135.00,
    initialStock: 35
  },
  {
    categoryName: 'Footwear',
    name: 'Cushioned Suede Driving Loafers',
    description: 'Supple suede slip-on driving loafers featuring padded leather footbeds and flexible split-rubber driving soles.',
    price: 85.00,
    initialStock: 40
  },
  {
    categoryName: 'Footwear',
    name: 'Supportive Cross-Training Shoes',
    description: 'Multi-directional gym trainers with wide flat heel base, lateral forefoot stability wrap, and engineered mesh upper.',
    price: 95.00,
    initialStock: 50
  },

  // ==========================================
  // 4. BOOKS (6 Products)
  // ==========================================
  {
    categoryName: 'Books',
    name: 'Designing Data-Intensive Applications',
    description: 'Comprehensive guide to modern system architecture, distributed storage, consensus algorithms, and reliable data systems.',
    price: 45.00,
    initialStock: 60
  },
  {
    categoryName: 'Books',
    name: 'Clean Architecture',
    description: 'A craftsman guide to software structure, component boundaries, and dependency rule implementation by Robert C. Martin.',
    price: 38.50,
    initialStock: 40
  },
  {
    categoryName: 'Books',
    name: 'The Pragmatic Programmer',
    description: 'Influential classic software development handbook covering practical engineering habits, modularity, and career longevity.',
    price: 44.00,
    initialStock: 50
  },
  {
    categoryName: 'Books',
    name: 'Site Reliability Engineering',
    description: 'Foundational insights and operational practices on building, deploying, and maintaining scalable and resilient web services.',
    price: 42.00,
    initialStock: 35
  },
  {
    categoryName: 'Books',
    name: 'Modern Database Systems & SQL',
    description: 'Practical guide to relational query optimization, indexing strategies, transaction isolation levels, and data modeling.',
    price: 36.00,
    initialStock: 45
  },
  {
    categoryName: 'Books',
    name: 'Domain-Driven Design Principles',
    description: 'Essential text on managing complexity in software domain cores through strategic ubiquitous language and bounded contexts.',
    price: 48.00,
    initialStock: 30
  },

  // ==========================================
  // 5. HOME & KITCHEN (6 Products)
  // ==========================================
  {
    categoryName: 'Home & Kitchen',
    name: 'Stainless Steel Espresso Machine',
    description: '15-bar Italian pump espresso maker with manual steam wand, thermoblock heating system, and removable 1.5L water reservoir.',
    price: 199.99,
    initialStock: 15
  },
  {
    categoryName: 'Home & Kitchen',
    name: 'Non-Stick Cast Iron Skillet',
    description: 'Pre-seasoned heavy-duty 10-inch skillet with helper handle and dual pouring spouts for superior heat retention.',
    price: 49.99,
    initialStock: 80
  },
  {
    categoryName: 'Home & Kitchen',
    name: 'Precision Electric Gooseneck Kettle',
    description: '0.9L matte black electric kettle with digital temperature dial, 60-minute keep-warm mode, and 1200W rapid heating.',
    price: 68.00,
    initialStock: 40
  },
  {
    categoryName: 'Home & Kitchen',
    name: 'Japanese High-Carbon Chef Knife 8"',
    description: 'Razor-sharp 8-inch stainless steel kitchen knife with balanced ergonomic pakkawood handle and protective blade guard.',
    price: 75.00,
    initialStock: 35
  },
  {
    categoryName: 'Home & Kitchen',
    name: 'Organic Bamboo Food Prep Cutting Board',
    description: 'Reversible dense bamboo butcher block with deep juice collector groove and carved side carry handles.',
    price: 29.99,
    initialStock: 65
  },
  {
    categoryName: 'Home & Kitchen',
    name: 'Airtight Glass Food Storage Containers',
    description: '8-piece set of durable borosilicate glass meal prep containers with leakproof silicone gasket snap-lock lids.',
    price: 34.50,
    initialStock: 50
  },

  // ==========================================
  // 6. FURNITURE & HOME OFFICE (6 Products)
  // ==========================================
  {
    categoryName: 'Furniture & Home Office',
    name: 'Ergonomic Mesh Swivel Office Chair',
    description: 'High-back breathable mesh task chair with adaptive lumbar cushion, 3D adjustable armrests, and smooth tilt recline.',
    price: 229.00,
    initialStock: 25
  },
  {
    categoryName: 'Furniture & Home Office',
    name: 'Motorized Standing Desk 55"',
    description: 'Dual-motor electric height-adjustable desk with solid walnut-finish worktop, anti-collision sensor, and 4 memory presets.',
    price: 380.00,
    initialStock: 18
  },
  {
    categoryName: 'Furniture & Home Office',
    name: 'Architect LED Task Desk Lamp',
    description: 'Clamp-mounted aluminum double-hinge architect desk lamp with touch dimming control and 5 selectable color temperatures.',
    price: 49.99,
    initialStock: 45
  },
  {
    categoryName: 'Furniture & Home Office',
    name: 'Solid Wood Monitor Riser Stand',
    description: 'Handcrafted oak desktop monitor shelf elevating display to ergonomic eye level with open under-shelf keyboard storage.',
    price: 39.00,
    initialStock: 55
  },
  {
    categoryName: 'Furniture & Home Office',
    name: 'Mobile 3-Drawer Under-Desk Filing Cabinet',
    description: 'Cold-rolled steel lockable storage pedestal with smooth ball-bearing glides and 360-degree casters for office organization.',
    price: 119.00,
    initialStock: 20
  },
  {
    categoryName: 'Furniture & Home Office',
    name: 'Ergonomic Footrest with Rocking Function',
    description: 'Dual-sided orthopedic foam desk footrest with textured massage surface and curved rocking base for active sitting comfort.',
    price: 32.00,
    initialStock: 60
  },

  // ==========================================
  // 7. SPORTS & FITNESS (6 Products)
  // ==========================================
  {
    categoryName: 'Sports & Fitness',
    name: 'Adjustable Quick-Select Dumbbell Pair',
    description: 'Space-saving selectorized dumbbell system adjusting smoothly from 5 to 52.5 lbs per hand with secure rotary dials.',
    price: 249.00,
    initialStock: 20
  },
  {
    categoryName: 'Sports & Fitness',
    name: 'High-Density Non-Slip Yoga Mat 6mm',
    description: 'Eco-friendly textured TPE exercise mat with laser-engraved alignment guides and cotton shoulder sling carry strap.',
    price: 38.00,
    initialStock: 70
  },
  {
    categoryName: 'Sports & Fitness',
    name: 'Heavy-Duty Resistance Loop Bands Set',
    description: '5-pack natural latex resistance loop bands calibrated from extra-light to extra-heavy with compact breathable travel bag.',
    price: 24.99,
    initialStock: 85
  },
  {
    categoryName: 'Sports & Fitness',
    name: 'Cast Iron Competition Kettlebell 16kg',
    description: 'Single-piece gravity-cast iron kettlebell with matte powder-coated textured handle for stable two-handed swings and snatches.',
    price: 65.00,
    initialStock: 30
  },
  {
    categoryName: 'Sports & Fitness',
    name: 'Insulated Stainless Steel Gym Water Bottle',
    description: '32oz double-wall vacuum insulated stainless steel sports bottle with leakproof chug cap and rugged powder coat exterior.',
    price: 28.00,
    initialStock: 75
  },
  {
    categoryName: 'Sports & Fitness',
    name: 'Speed Cable Jump Rope with Ball Bearings',
    description: 'Kink-free coated steel wire jump rope with 360-degree dual ball bearings and textured non-slip aluminum knurled handles.',
    price: 18.50,
    initialStock: 90
  },

  // ==========================================
  // 8. BEAUTY & PERSONAL CARE (6 Products)
  // ==========================================
  {
    categoryName: 'Beauty & Personal Care',
    name: 'Hydrating Botanical Face Serum 30ml',
    description: 'Pure hyaluronic acid and vitamin B5 facial serum formulated to replenish deep moisture balance with a non-sticky finish.',
    price: 34.00,
    initialStock: 60
  },
  {
    categoryName: 'Beauty & Personal Care',
    name: 'Sonic Electric Toothbrush with Travel Case',
    description: '40,000 VPM sonic motor toothbrush featuring 4 brushing modes, smart 2-minute timer, and long-lasting 30-day lithium battery.',
    price: 59.00,
    initialStock: 45
  },
  {
    categoryName: 'Beauty & Personal Care',
    name: 'Cold-Pressed Jojoba & Argan Hair Oil',
    description: '100% natural organic blend hair treatment oil designed to nourish dry follicles, control flyaways, and restore natural shine.',
    price: 26.50,
    initialStock: 55
  },
  {
    categoryName: 'Beauty & Personal Care',
    name: 'Natural Shea Butter Body Cream 200g',
    description: 'Deeply moisturizing all-over body cream crafted with unrefined African shea butter and soothing organic chamomile extract.',
    price: 22.00,
    initialStock: 70
  },
  {
    categoryName: 'Beauty & Personal Care',
    name: 'Rechargeable Men Precision Beard Trimmer',
    description: 'Cordless stainless steel self-sharpening beard trimmer with 20 precision length settings and USB quick charge dock.',
    price: 48.00,
    initialStock: 40
  },
  {
    categoryName: 'Beauty & Personal Care',
    name: 'Mineral Sunscreen Lotion SPF 50',
    description: 'Broad-spectrum non-nano zinc oxide sunscreen lotion that absorbs quickly with no white cast, water-resistant up to 80 minutes.',
    price: 28.00,
    initialStock: 65
  },

  // ==========================================
  // 9. BAGS & TRAVEL (6 Products)
  // ==========================================
  {
    categoryName: 'Bags & Travel',
    name: 'Water-Resistant Commuter Laptop Backpack 20L',
    description: 'Weatherproof everyday carry backpack with dedicated 16-inch padded laptop sleeve, luggage trolley pass-through, and secret pocket.',
    price: 89.00,
    initialStock: 45
  },
  {
    categoryName: 'Bags & Travel',
    name: 'Expandable Carry-On Hardside Spinner 21"',
    description: 'Lightweight polycarbonate cabin suitcase with 360-degree silent dual-spinner wheels and integrated TSA combination lock.',
    price: 145.00,
    initialStock: 25
  },
  {
    categoryName: 'Bags & Travel',
    name: 'Canvas Weekender Duffel Overnight Bag',
    description: 'Heavy-duty 16oz waxed canvas duffel bag featuring genuine leather handles, ventilated shoe pocket, and detachable strap.',
    price: 68.00,
    initialStock: 35
  },
  {
    categoryName: 'Bags & Travel',
    name: 'RFID-Blocking Leather Bifold Wallet',
    description: 'Slim top-grain leather wallet with 8 card slots, dual cash compartment, and built-in RFID shielding to protect personal data.',
    price: 32.00,
    initialStock: 80
  },
  {
    categoryName: 'Bags & Travel',
    name: 'Waterproof Hanging Toiletries Travel Kit',
    description: 'Multi-compartment toiletry kit with leakproof clear pockets, water-repellent nylon, and 360-degree swivel hanging hook.',
    price: 24.50,
    initialStock: 65
  },
  {
    categoryName: 'Bags & Travel',
    name: 'Ultra-Light Packable Crossbody Sling Bag',
    description: 'Compact tear-resistant ripstop nylon sling bag with water-resistant zips, front key clip, and ambidextrous shoulder strap.',
    price: 36.00,
    initialStock: 55
  }
];

export async function seedCatalog() {
  console.log('====================================================');
  console.log('🌱 Starting ShopFlow Realistic Catalog Seeding...');
  console.log('====================================================');

  const client = await pool.connect();

  try {
    // 1. Fetch all existing categories from the database
    const catQuery = await client.query('SELECT id, name FROM categories ORDER BY id ASC');
    const existingCats = catQuery.rows;

    // Create case-insensitive lookup
    const catMap = new Map();
    for (const c of existingCats) {
      catMap.set(c.name.trim().toLowerCase(), c.id);
    }

    console.log(`📋 Found ${existingCats.length} total category records in database.`);

    // 2. Ensure the 9 legitimate categories exist
    const REQUIRED_CATEGORIES = [
      { name: 'Electronics', description: 'Gadgets, devices, hardware, and electronic accessories' },
      { name: 'Clothing', description: 'Apparel, garments, and fashion accessories' },
      { name: 'Footwear', description: 'Athletic shoes, casual sneakers, boots, and footwear essentials' },
      { name: 'Books', description: 'Physical books, novels, textbooks, and literature' },
      { name: 'Home & Kitchen', description: 'Home appliances, cookware, and living essentials' },
      { name: 'Furniture & Home Office', description: 'Desks, ergonomic chairs, office storage, and home furniture' },
      { name: 'Sports & Fitness', description: 'Exercise equipment, athletic gear, outdoor activewear, and sports accessories' },
      { name: 'Beauty & Personal Care', description: 'Skincare, grooming tools, wellness products, and personal hygiene essentials' },
      { name: 'Bags & Travel', description: 'Backpacks, luggage, travel accessories, wallets, and carrier bags' }
    ];

    for (const reqCat of REQUIRED_CATEGORIES) {
      const lowerName = reqCat.name.toLowerCase();
      if (!catMap.has(lowerName)) {
        console.log(`➕ Creating missing category: '${reqCat.name}'`);
        const ins = await client.query(
          'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id, name',
          [reqCat.name, reqCat.description]
        );
        catMap.set(lowerName, ins.rows[0].id);
      }
    }

    console.log('✅ Verified all 9 store categories are mapped to real IDs.');

    // 3. Process each catalog item inside a transaction
    await client.query('BEGIN');

    let insertedCount = 0;
    let existingCount = 0;

    for (const item of CATALOG_DATA) {
      const lowerCat = item.categoryName.toLowerCase();
      const categoryId = catMap.get(lowerCat);

      if (!categoryId) {
        throw new Error(`Category '${item.categoryName}' could not be resolved!`);
      }

      // Check if product already exists by exact name
      const existingProdQuery = await client.query(
        'SELECT id, name, price, category_id FROM products WHERE LOWER(name) = LOWER($1)',
        [item.name.trim()]
      );

      let productId;

      if (existingProdQuery.rows.length > 0) {
        // Product exists - update description and ensure correct category_id
        const existing = existingProdQuery.rows[0];
        productId = existing.id;
        existingCount++;

        await client.query(
          `UPDATE products
           SET category_id = $1, description = $2, price = $3, is_active = true
           WHERE id = $4`,
          [categoryId, item.description, item.price, productId]
        );
      } else {
        // Insert new product
        const insProd = await client.query(
          `INSERT INTO products (category_id, name, description, price, is_active)
           VALUES ($1, $2, $3, $4, true)
           RETURNING id`,
          [categoryId, item.name.trim(), item.description, item.price]
        );
        productId = insProd.rows[0].id;
        insertedCount++;
      }

      // Check if inventory record exists for this product
      const existingInvQuery = await client.query(
        'SELECT id, quantity FROM inventory WHERE product_id = $1',
        [productId]
      );

      if (existingInvQuery.rows.length === 0) {
        // Create initial inventory record
        await client.query(
          'INSERT INTO inventory (product_id, quantity) VALUES ($1, $2)',
          [productId, item.initialStock]
        );

        // Record initial stock allocation in inventory movements audit ledger
        await client.query(
          `INSERT INTO inventory_movements (product_id, order_id, change_quantity, resulting_quantity, movement_type, notes)
           VALUES ($1, NULL, $2, $2, 'INITIAL_STOCK', 'Catalog seed warehouse allocation')`,
          [productId, item.initialStock]
        );
      }
    }

    await client.query('COMMIT');
    await cleanupTestData();

    console.log('----------------------------------------------------');
    console.log(`🎉 Catalog Seeding Complete!`);
    console.log(`   - Newly inserted products: ${insertedCount}`);
    console.log(`   - Verified existing products: ${existingCount}`);
    console.log(`   - Total catalog items processed: ${CATALOG_DATA.length}`);
    console.log('====================================================');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed, transaction rolled back:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Allow direct CLI execution
if (process.argv[1]?.endsWith('seed_catalog.js')) {
  seedCatalog()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      await pool.end();
      process.exit(1);
    });
}
