import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import shipmentRoutes from './routes/shipments.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Auto-seed database if empty
async function seedDatabaseIfEmpty() {
  try {
    const count = await prisma.item.count();
    if (count === 0) {
      console.log('Database empty, seeding with products...');

      const categories = {
        Apparel: [
          { name: 'Classic Logo T-Shirt', basePrice: 25, description: 'Comfortable cotton t-shirt with company logo' },
          { name: 'Premium Polo Shirt', basePrice: 45, description: 'Professional polo shirt with embroidered logo' },
          { name: 'Zip-Up Hoodie', basePrice: 65, description: 'Cozy hoodie with front zip and company branding' },
          { name: 'Pullover Hoodie', basePrice: 55, description: 'Classic pullover hoodie with screen-printed logo' },
          { name: 'Crewneck Sweatshirt', basePrice: 50, description: 'Soft crewneck sweatshirt with subtle branding' },
          { name: 'Baseball Cap', basePrice: 22, description: 'Adjustable cap with embroidered logo' },
          { name: 'Beanie', basePrice: 18, description: 'Warm knit beanie with company tag' },
          { name: 'Performance Jacket', basePrice: 85, description: 'Lightweight water-resistant jacket' },
        ],
        Tech: [
          { name: 'Wireless Mouse', basePrice: 35, description: 'Ergonomic wireless mouse with company logo' },
          { name: 'Mechanical Keyboard', basePrice: 89, description: 'RGB mechanical keyboard with custom keycaps' },
          { name: 'USB-C Hub', basePrice: 55, description: '7-in-1 USB-C hub for laptops' },
          { name: 'Wireless Earbuds', basePrice: 79, description: 'True wireless earbuds with charging case' },
          { name: 'Portable Charger', basePrice: 40, description: '10000mAh power bank with dual USB' },
          { name: 'Phone Stand', basePrice: 25, description: 'Adjustable aluminum phone stand' },
          { name: 'Laptop Stand', basePrice: 45, description: 'Ergonomic laptop riser' },
          { name: 'Wireless Charging Pad', basePrice: 30, description: 'Fast wireless charging pad' },
        ],
        Office: [
          { name: 'Leather Notebook', basePrice: 28, description: 'Premium leather-bound notebook' },
          { name: 'Ballpoint Pen Set', basePrice: 35, description: 'Set of 3 premium ballpoint pens' },
          { name: 'Desk Organizer', basePrice: 38, description: 'Wooden desk organizer with compartments' },
          { name: 'Mouse Pad', basePrice: 18, description: 'Large extended mouse pad with logo' },
          { name: 'Desk Mat', basePrice: 35, description: 'Full desk leather mat' },
          { name: 'Desk Clock', basePrice: 42, description: 'Minimalist desk clock with logo' },
        ],
        Drinkware: [
          { name: 'Insulated Tumbler', basePrice: 28, description: '20oz stainless steel tumbler' },
          { name: 'Coffee Mug', basePrice: 15, description: 'Ceramic mug with company logo' },
          { name: 'Travel Mug', basePrice: 25, description: 'Spill-proof travel coffee mug' },
          { name: 'Water Bottle', basePrice: 22, description: 'BPA-free 24oz water bottle' },
          { name: 'Insulated Water Bottle', basePrice: 35, description: '32oz vacuum insulated bottle' },
        ],
        Bags: [
          { name: 'Laptop Backpack', basePrice: 75, description: 'Professional laptop backpack with padded compartment' },
          { name: 'Tote Bag', basePrice: 35, description: 'Canvas tote bag with company logo' },
          { name: 'Messenger Bag', basePrice: 65, description: 'Leather messenger bag for professionals' },
          { name: 'Duffel Bag', basePrice: 55, description: 'Sports duffel bag with shoe compartment' },
          { name: 'Laptop Sleeve', basePrice: 30, description: 'Padded laptop sleeve with pocket' },
        ],
        Accessories: [
          { name: 'Sunglasses', basePrice: 45, description: 'UV protection sunglasses with case' },
          { name: 'Umbrella', basePrice: 30, description: 'Compact automatic umbrella' },
          { name: 'Keychain', basePrice: 12, description: 'Metal keychain with company logo' },
          { name: 'Lanyard', basePrice: 8, description: 'Breakaway lanyard with badge holder' },
          { name: 'Watch', basePrice: 95, description: 'Minimalist watch with company logo' },
          { name: 'Socks Set', basePrice: 20, description: 'Pack of 3 branded socks' },
        ]
      };

      const variants = ['Navy', 'Black', 'Charcoal', 'Gray', 'White', 'Blue'];
      const items = [];

      for (const [category, products] of Object.entries(categories)) {
        for (const product of products) {
          for (const variant of variants) {
            for (let i = 0; i < 3; i++) {
              const priceVariation = (Math.random() - 0.5) * 10;
              items.push({
                name: `${product.name} - ${variant}${i > 0 ? ` v${i + 1}` : ''}`,
                description: product.description,
                price: Math.round((product.basePrice + priceVariation) * 100) / 100,
                category,
                imageUrl: `https://placehold.co/400x400/1a73e8/ffffff?text=${encodeURIComponent(product.name.split(' ').slice(0, 2).join('+'))}`,
                stock: Math.floor(Math.random() * 150) + 50
              });
            }
          }
        }
      }

      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < Math.min(items.length, 1000); i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await prisma.item.createMany({ data: batch });
      }

      const finalCount = await prisma.item.count();
      console.log(`Database seeded with ${finalCount} items`);
    } else {
      console.log(`Database already has ${count} items`);
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://js.stripe.com", "https://m.stripe.network"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com", "https://m.stripe.network"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://m.stripe.network", "https://api.mapbox.com", "https://*.tiles.mapbox.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:"],
    }
  } : false
}));

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3001'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
      return callback(null, true);
    }
    if (isProduction && origin.includes('railway.app')) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts, please try again later.' }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Config endpoint
app.get('/api/config', (req, res) => {
  res.json({
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    mapboxToken: process.env.MAPBOX_ACCESS_TOKEN
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipments', shipmentRoutes);

// Serve static files in production
if (isProduction) {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server and seed database
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  await seedDatabaseIfEmpty();
});

export default app;
