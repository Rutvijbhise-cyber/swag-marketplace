import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Product templates by category
const categories = {
  Apparel: {
    items: [
      { name: 'Classic Logo T-Shirt', basePrice: 25, description: 'Comfortable cotton t-shirt with company logo' },
      { name: 'Premium Polo Shirt', basePrice: 45, description: 'Professional polo shirt with embroidered logo' },
      { name: 'Zip-Up Hoodie', basePrice: 65, description: 'Cozy hoodie with front zip and company branding' },
      { name: 'Pullover Hoodie', basePrice: 55, description: 'Classic pullover hoodie with screen-printed logo' },
      { name: 'Crewneck Sweatshirt', basePrice: 50, description: 'Soft crewneck sweatshirt with subtle branding' },
      { name: 'Quarter-Zip Pullover', basePrice: 60, description: 'Athletic quarter-zip with performance fabric' },
      { name: 'Baseball Cap', basePrice: 22, description: 'Adjustable cap with embroidered logo' },
      { name: 'Beanie', basePrice: 18, description: 'Warm knit beanie with company tag' },
      { name: 'Performance Jacket', basePrice: 85, description: 'Lightweight water-resistant jacket' },
      { name: 'Fleece Vest', basePrice: 55, description: 'Comfortable fleece vest for layering' },
      { name: 'Athletic Shorts', basePrice: 35, description: 'Breathable shorts with side logo' },
      { name: 'Jogger Pants', basePrice: 48, description: 'Comfortable joggers with drawstring waist' },
      { name: 'Long Sleeve Tee', basePrice: 30, description: 'Long sleeve cotton t-shirt' },
      { name: 'Tank Top', basePrice: 20, description: 'Lightweight tank top for summer' },
      { name: 'Windbreaker', basePrice: 70, description: 'Packable windbreaker jacket' }
    ],
    variants: ['Navy', 'Black', 'Charcoal', 'Heather Gray', 'White', 'Forest Green', 'Burgundy', 'Royal Blue'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  },
  Tech: {
    items: [
      { name: 'Wireless Mouse', basePrice: 35, description: 'Ergonomic wireless mouse with company logo' },
      { name: 'Mechanical Keyboard', basePrice: 89, description: 'RGB mechanical keyboard with custom keycaps' },
      { name: 'USB-C Hub', basePrice: 55, description: '7-in-1 USB-C hub for laptops' },
      { name: 'Wireless Earbuds', basePrice: 79, description: 'True wireless earbuds with charging case' },
      { name: 'Portable Charger', basePrice: 40, description: '10000mAh power bank with dual USB' },
      { name: 'Webcam Cover', basePrice: 8, description: 'Sliding webcam privacy cover' },
      { name: 'Phone Stand', basePrice: 25, description: 'Adjustable aluminum phone stand' },
      { name: 'Laptop Stand', basePrice: 45, description: 'Ergonomic laptop riser' },
      { name: 'Cable Organizer', basePrice: 15, description: 'Magnetic cable management clips' },
      { name: 'Wireless Charging Pad', basePrice: 30, description: 'Fast wireless charging pad' },
      { name: 'Bluetooth Speaker', basePrice: 55, description: 'Portable waterproof speaker' },
      { name: 'USB Flash Drive', basePrice: 18, description: '64GB USB 3.0 flash drive' },
      { name: 'Screen Cleaning Kit', basePrice: 12, description: 'Microfiber cloth and cleaning solution' },
      { name: 'LED Desk Lamp', basePrice: 48, description: 'Adjustable LED lamp with USB charging' },
      { name: 'Smart Tracker', basePrice: 28, description: 'Bluetooth tracker for keys and bags' }
    ],
    variants: ['Standard'],
    sizes: []
  },
  Office: {
    items: [
      { name: 'Leather Notebook', basePrice: 28, description: 'Premium leather-bound notebook' },
      { name: 'Hardcover Journal', basePrice: 22, description: 'Lined hardcover journal with ribbon' },
      { name: 'Ballpoint Pen Set', basePrice: 35, description: 'Set of 3 premium ballpoint pens' },
      { name: 'Fountain Pen', basePrice: 65, description: 'Elegant fountain pen with custom engraving' },
      { name: 'Desk Organizer', basePrice: 38, description: 'Wooden desk organizer with compartments' },
      { name: 'Mouse Pad', basePrice: 18, description: 'Large extended mouse pad with logo' },
      { name: 'Desk Mat', basePrice: 35, description: 'Full desk leather mat' },
      { name: 'Sticky Notes Set', basePrice: 12, description: 'Branded sticky notes in various sizes' },
      { name: 'Business Card Holder', basePrice: 25, description: 'Metal business card holder' },
      { name: 'Desk Clock', basePrice: 42, description: 'Minimalist desk clock with logo' },
      { name: 'Bookmark Set', basePrice: 10, description: 'Set of 5 metal bookmarks' },
      { name: 'Document Folder', basePrice: 20, description: 'Leather document portfolio' },
      { name: 'Paperweight', basePrice: 30, description: 'Crystal paperweight with logo' },
      { name: 'Desk Name Plate', basePrice: 45, description: 'Personalized desk name plate' },
      { name: 'Whiteboard Set', basePrice: 55, description: 'Magnetic whiteboard with markers' }
    ],
    variants: ['Black', 'Brown', 'Navy', 'Gray'],
    sizes: []
  },
  Drinkware: {
    items: [
      { name: 'Insulated Tumbler', basePrice: 28, description: '20oz stainless steel tumbler' },
      { name: 'Coffee Mug', basePrice: 15, description: 'Ceramic mug with company logo' },
      { name: 'Travel Mug', basePrice: 25, description: 'Spill-proof travel coffee mug' },
      { name: 'Water Bottle', basePrice: 22, description: 'BPA-free 24oz water bottle' },
      { name: 'Insulated Water Bottle', basePrice: 35, description: '32oz vacuum insulated bottle' },
      { name: 'Wine Tumbler', basePrice: 20, description: 'Insulated wine tumbler with lid' },
      { name: 'Glass Bottle', basePrice: 18, description: 'Borosilicate glass bottle with sleeve' },
      { name: 'Collapsible Bottle', basePrice: 15, description: 'Silicone collapsible water bottle' },
      { name: 'Cocktail Shaker', basePrice: 30, description: 'Stainless steel cocktail shaker' },
      { name: 'Beer Mug', basePrice: 18, description: 'Glass beer mug with logo' },
      { name: 'Espresso Cup Set', basePrice: 38, description: 'Set of 4 espresso cups' },
      { name: 'Thermos', basePrice: 40, description: 'Large capacity thermos flask' },
      { name: 'Infuser Bottle', basePrice: 25, description: 'Water bottle with fruit infuser' },
      { name: 'Coffee Tumbler', basePrice: 32, description: 'Ceramic-lined coffee tumbler' },
      { name: 'Can Cooler', basePrice: 12, description: 'Neoprene can cooler sleeve' }
    ],
    variants: ['Black', 'White', 'Navy', 'Stainless', 'Matte Black', 'Rose Gold'],
    sizes: []
  },
  Bags: {
    items: [
      { name: 'Laptop Backpack', basePrice: 75, description: 'Professional laptop backpack with padded compartment' },
      { name: 'Tote Bag', basePrice: 35, description: 'Canvas tote bag with company logo' },
      { name: 'Messenger Bag', basePrice: 65, description: 'Leather messenger bag for professionals' },
      { name: 'Duffel Bag', basePrice: 55, description: 'Sports duffel bag with shoe compartment' },
      { name: 'Drawstring Bag', basePrice: 15, description: 'Lightweight drawstring backpack' },
      { name: 'Cooler Bag', basePrice: 40, description: 'Insulated lunch cooler bag' },
      { name: 'Laptop Sleeve', basePrice: 30, description: 'Padded laptop sleeve with pocket' },
      { name: 'Weekender Bag', basePrice: 85, description: 'Premium weekender travel bag' },
      { name: 'Toiletry Bag', basePrice: 28, description: 'Hanging toiletry bag' },
      { name: 'Tech Pouch', basePrice: 25, description: 'Organizer pouch for cables and accessories' },
      { name: 'Gym Bag', basePrice: 45, description: 'Gym bag with wet pocket' },
      { name: 'Crossbody Bag', basePrice: 38, description: 'Compact crossbody bag' },
      { name: 'Fanny Pack', basePrice: 22, description: 'Adjustable belt bag' },
      { name: 'Shoe Bag', basePrice: 18, description: 'Travel shoe bag set' },
      { name: 'Garment Bag', basePrice: 50, description: 'Suit garment bag for travel' }
    ],
    variants: ['Black', 'Navy', 'Gray', 'Charcoal', 'Olive'],
    sizes: []
  },
  Accessories: {
    items: [
      { name: 'Sunglasses', basePrice: 45, description: 'UV protection sunglasses with case' },
      { name: 'Umbrella', basePrice: 30, description: 'Compact automatic umbrella' },
      { name: 'Golf Umbrella', basePrice: 45, description: 'Large golf umbrella with logo' },
      { name: 'Keychain', basePrice: 12, description: 'Metal keychain with company logo' },
      { name: 'Lanyard', basePrice: 8, description: 'Breakaway lanyard with badge holder' },
      { name: 'Scarf', basePrice: 35, description: 'Soft knit scarf with company colors' },
      { name: 'Gloves', basePrice: 28, description: 'Touchscreen compatible gloves' },
      { name: 'Watch', basePrice: 95, description: 'Minimalist watch with company logo' },
      { name: 'Socks Set', basePrice: 20, description: 'Pack of 3 branded socks' },
      { name: 'Belt', basePrice: 40, description: 'Leather belt with subtle branding' },
      { name: 'Wallet', basePrice: 55, description: 'Leather bifold wallet' },
      { name: 'Card Holder', basePrice: 30, description: 'Slim card holder wallet' },
      { name: 'Tie', basePrice: 35, description: 'Silk tie with company pattern' },
      { name: 'Pin Set', basePrice: 15, description: 'Collectible enamel pin set' },
      { name: 'Badge Holder', basePrice: 18, description: 'Retractable badge reel' }
    ],
    variants: ['Black', 'Navy', 'Brown', 'Gray', 'Company Blue'],
    sizes: []
  }
};

// Generate placeholder image URLs
const generateImageUrl = (category, itemName, variant) => {
  const seed = `${category}-${itemName}-${variant}`.replace(/\s+/g, '-').toLowerCase();
  const colors = {
    'Navy': '1a237e',
    'Black': '212121',
    'Charcoal': '424242',
    'Heather Gray': '9e9e9e',
    'White': 'fafafa',
    'Forest Green': '1b5e20',
    'Burgundy': '880e4f',
    'Royal Blue': '1565c0',
    'Brown': '5d4037',
    'Gray': '757575',
    'Stainless': 'b0bec5',
    'Matte Black': '263238',
    'Rose Gold': 'e8b4b8',
    'Olive': '827717',
    'Company Blue': '1a73e8',
    'Standard': '1a73e8'
  };
  const bgColor = colors[variant] || '1a73e8';
  return `https://placehold.co/400x400/${bgColor}/ffffff?text=${encodeURIComponent(itemName.split(' ').slice(0, 2).join('+'))}`;
};

async function seed() {
  console.log('Starting database seed...');

  // Clear existing items
  await prisma.item.deleteMany();

  const items = [];
  let itemCount = 0;
  const targetCount = 1000;

  // Generate items until we reach 1000
  while (itemCount < targetCount) {
    for (const [category, data] of Object.entries(categories)) {
      for (const template of data.items) {
        for (const variant of data.variants) {
          if (itemCount >= targetCount) break;

          // For apparel, create size variants
          if (category === 'Apparel' && data.sizes.length > 0) {
            for (const size of data.sizes) {
              if (itemCount >= targetCount) break;

              const priceVariation = (Math.random() - 0.5) * 10;
              const price = Math.round((template.basePrice + priceVariation) * 100) / 100;

              items.push({
                name: `${template.name} - ${variant} (${size})`,
                description: template.description,
                price: Math.max(price, 5),
                category,
                imageUrl: generateImageUrl(category, template.name, variant),
                stock: Math.floor(Math.random() * 150) + 50
              });
              itemCount++;
            }
          } else {
            // Non-apparel or single variant
            const priceVariation = (Math.random() - 0.5) * 10;
            const price = Math.round((template.basePrice + priceVariation) * 100) / 100;
            const variantSuffix = variant !== 'Standard' ? ` - ${variant}` : '';

            items.push({
              name: `${template.name}${variantSuffix}`,
              description: template.description,
              price: Math.max(price, 5),
              category,
              imageUrl: generateImageUrl(category, template.name, variant),
              stock: Math.floor(Math.random() * 150) + 50
            });
            itemCount++;
          }
        }
      }
    }
  }

  // Batch insert items
  console.log(`Creating ${items.length} items...`);

  const batchSize = 100;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await prisma.item.createMany({ data: batch });
    console.log(`Inserted items ${i + 1} to ${Math.min(i + batchSize, items.length)}`);
  }

  // Verify count
  const count = await prisma.item.count();
  console.log(`Database seeded with ${count} items`);

  // Show category breakdown
  const categoryCounts = await prisma.item.groupBy({
    by: ['category'],
    _count: { id: true }
  });

  console.log('\nItems by category:');
  for (const cat of categoryCounts) {
    console.log(`  ${cat.category}: ${cat._count.id}`);
  }
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
