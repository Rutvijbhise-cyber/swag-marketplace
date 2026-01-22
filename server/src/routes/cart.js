import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { cartItemValidation, uuidParamValidation } from '../middleware/validate.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get cart
router.get('/', authenticate, async (req, res, next) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            category: true,
            imageUrl: true,
            stock: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = cartItems.reduce((sum, ci) => sum + (ci.item.price * ci.quantity), 0);

    res.json({
      items: cartItems.map(ci => ({
        id: ci.id,
        itemId: ci.item.id,
        name: ci.item.name,
        description: ci.item.description,
        price: ci.item.price,
        category: ci.item.category,
        imageUrl: ci.item.imageUrl,
        quantity: ci.quantity,
        subtotal: ci.item.price * ci.quantity,
        stock: ci.item.stock
      })),
      total: Math.round(total * 100) / 100,
      itemCount: cartItems.reduce((sum, ci) => sum + ci.quantity, 0)
    });
  } catch (error) {
    next(error);
  }
});

// Add to cart
router.post('/items', authenticate, cartItemValidation, async (req, res, next) => {
  try {
    const { itemId, quantity } = req.body;

    // Check if item exists
    const item = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.stock < quantity) {
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    // Upsert cart item
    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_itemId: {
          userId: req.user.id,
          itemId
        }
      },
      update: {
        quantity: { increment: quantity }
      },
      create: {
        userId: req.user.id,
        itemId,
        quantity
      },
      include: {
        item: true
      }
    });

    // Validate total quantity doesn't exceed stock
    if (cartItem.quantity > item.stock) {
      await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: item.stock }
      });
      return res.status(400).json({
        error: 'Cart quantity adjusted to maximum available stock',
        maxStock: item.stock
      });
    }

    res.status(201).json({
      message: 'Item added to cart',
      cartItem: {
        id: cartItem.id,
        itemId: cartItem.item.id,
        name: cartItem.item.name,
        price: cartItem.item.price,
        quantity: cartItem.quantity
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update cart item quantity
router.patch('/items/:id', authenticate, async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 0 || quantity > 10) {
      return res.status(400).json({ error: 'Quantity must be between 0 and 10' });
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: { item: true }
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (quantity === 0) {
      await prisma.cartItem.delete({
        where: { id: cartItem.id }
      });
      return res.json({ message: 'Item removed from cart' });
    }

    if (quantity > cartItem.item.stock) {
      return res.status(400).json({
        error: 'Not enough stock available',
        maxStock: cartItem.item.stock
      });
    }

    const updated = await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity },
      include: { item: true }
    });

    res.json({
      message: 'Cart updated',
      cartItem: {
        id: updated.id,
        itemId: updated.item.id,
        name: updated.item.name,
        price: updated.item.price,
        quantity: updated.quantity
      }
    });
  } catch (error) {
    next(error);
  }
});

// Remove from cart
router.delete('/items/:id', authenticate, async (req, res, next) => {
  try {
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await prisma.cartItem.delete({
      where: { id: cartItem.id }
    });

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
});

// Clear cart
router.delete('/', authenticate, async (req, res, next) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { userId: req.user.id }
    });

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
});

export default router;
