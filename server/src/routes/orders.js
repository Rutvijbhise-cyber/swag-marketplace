import express from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { addressValidation, uuidParamValidation } from '../middleware/validate.js';

const router = express.Router();
const prisma = new PrismaClient();

// Generate tracking number
const generateTrackingNumber = () => {
  const prefix = 'SWG';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = uuidv4().slice(0, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Get user orders
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: req.user.id },
        include: {
          orderItems: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  category: true
                }
              }
            }
          },
          shipment: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where: { userId: req.user.id } })
    ]);

    res.json({
      orders: orders.map(order => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt,
        shippingAddress: {
          address: order.shippingAddress,
          city: order.shippingCity,
          state: order.shippingState,
          zipCode: order.shippingZip,
          country: order.shippingCountry
        },
        items: order.orderItems.map(oi => ({
          id: oi.id,
          itemId: oi.item.id,
          name: oi.item.name,
          imageUrl: oi.item.imageUrl,
          category: oi.item.category,
          quantity: oi.quantity,
          priceAtPurchase: oi.priceAtPurchase
        })),
        shipment: order.shipment ? {
          status: order.shipment.status,
          carrier: order.shipment.carrier,
          estimatedDelivery: order.shipment.estimatedDelivery,
          currentLocation: {
            lat: order.shipment.currentLat,
            lng: order.shipment.currentLng
          }
        } : null
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single order
router.get('/:id', authenticate, uuidParamValidation, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        orderItems: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                description: true,
                imageUrl: true,
                category: true
              }
            }
          }
        },
        shipment: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt,
        shippingAddress: {
          address: order.shippingAddress,
          city: order.shippingCity,
          state: order.shippingState,
          zipCode: order.shippingZip,
          country: order.shippingCountry
        },
        items: order.orderItems.map(oi => ({
          id: oi.id,
          itemId: oi.item.id,
          name: oi.item.name,
          description: oi.item.description,
          imageUrl: oi.item.imageUrl,
          category: oi.item.category,
          quantity: oi.quantity,
          priceAtPurchase: oi.priceAtPurchase,
          subtotal: oi.quantity * oi.priceAtPurchase
        })),
        shipment: order.shipment ? {
          id: order.shipment.id,
          trackingNumber: order.shipment.trackingNumber,
          status: order.shipment.status,
          carrier: order.shipment.carrier,
          estimatedDelivery: order.shipment.estimatedDelivery,
          lastUpdated: order.shipment.lastUpdated,
          origin: {
            lat: order.shipment.originLat,
            lng: order.shipment.originLng
          },
          destination: {
            lat: order.shipment.destLat,
            lng: order.shipment.destLng
          },
          currentLocation: {
            lat: order.shipment.currentLat,
            lng: order.shipment.currentLng
          }
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create order
router.post('/', authenticate, addressValidation, async (req, res, next) => {
  try {
    const { address, city, state, zipCode, country } = req.body;

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { item: true }
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total
    const total = cartItems.reduce((sum, ci) => sum + (ci.item.price * ci.quantity), 0);
    const roundedTotal = Math.round(total * 100) / 100;

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (user.credits < roundedTotal) {
      return res.status(400).json({
        error: 'Insufficient credits',
        required: roundedTotal,
        available: user.credits
      });
    }

    // Verify stock for all items
    for (const ci of cartItems) {
      if (ci.item.stock < ci.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${ci.item.name}`,
          available: ci.item.stock,
          requested: ci.quantity
        });
      }
    }

    // Create order in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          userId: req.user.id,
          status: 'confirmed',
          totalAmount: roundedTotal,
          shippingAddress: address,
          shippingCity: city,
          shippingState: state,
          shippingZip: zipCode,
          shippingCountry: country,
          trackingNumber: generateTrackingNumber(),
          orderItems: {
            create: cartItems.map(ci => ({
              itemId: ci.item.id,
              quantity: ci.quantity,
              priceAtPurchase: ci.item.price
            }))
          }
        },
        include: {
          orderItems: {
            include: { item: true }
          }
        }
      });

      // Deduct credits
      await tx.user.update({
        where: { id: req.user.id },
        data: { credits: { decrement: roundedTotal } }
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          userId: req.user.id,
          type: 'order_payment',
          amount: -roundedTotal,
          description: `Order ${order.id}`
        }
      });

      // Update stock
      for (const ci of cartItems) {
        await tx.item.update({
          where: { id: ci.item.id },
          data: { stock: { decrement: ci.quantity } }
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { userId: req.user.id }
      });

      // Create shipment with simulated location
      // Origin: Company warehouse (San Francisco)
      // Destination: Based on shipping address (simulated)
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

      await tx.shipment.create({
        data: {
          orderId: order.id,
          trackingNumber: order.trackingNumber,
          status: 'processing',
          originLat: 37.7749,
          originLng: -122.4194,
          destLat: 40.7128 + (Math.random() - 0.5) * 10,
          destLng: -74.0060 + (Math.random() - 0.5) * 10,
          currentLat: 37.7749,
          currentLng: -122.4194,
          estimatedDelivery
        }
      });

      return order;
    });

    // Get updated user credits
    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { credits: true }
    });

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        id: result.id,
        trackingNumber: result.trackingNumber,
        status: result.status,
        totalAmount: result.totalAmount,
        items: result.orderItems.map(oi => ({
          name: oi.item.name,
          quantity: oi.quantity,
          price: oi.priceAtPurchase
        }))
      },
      remainingCredits: updatedUser.credits
    });
  } catch (error) {
    next(error);
  }
});

export default router;
