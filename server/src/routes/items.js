import express from 'express';
import { PrismaClient } from '@prisma/client';
import { paginationValidation, uuidParamValidation } from '../middleware/validate.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all items (paginated)
router.get('/', paginationValidation, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';

    const where = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          category: true,
          imageUrl: true,
          stock: true
        }
      }),
      prisma.item.count({ where })
    ]);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.item.groupBy({
      by: ['category'],
      _count: { id: true }
    });

    res.json({
      categories: categories.map(c => ({
        name: c.category,
        count: c._count.id
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get single item
router.get('/:id', uuidParamValidation, async (req, res, next) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        imageUrl: true,
        stock: true
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ item });
  } catch (error) {
    next(error);
  }
});

export default router;
