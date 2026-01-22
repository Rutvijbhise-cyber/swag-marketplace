import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Shipment status progression
const STATUS_PROGRESSION = [
  'processing',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered'
];

// Get shipment by order ID
router.get('/order/:orderId', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.orderId,
        userId: req.user.id
      },
      include: {
        shipment: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Simulate shipment progress based on time since order
    const shipment = await simulateShipmentProgress(order.shipment);

    res.json({
      shipment: {
        id: shipment.id,
        trackingNumber: shipment.trackingNumber,
        carrier: shipment.carrier,
        status: shipment.status,
        statusLabel: formatStatus(shipment.status),
        estimatedDelivery: shipment.estimatedDelivery,
        lastUpdated: shipment.lastUpdated,
        origin: {
          lat: shipment.originLat,
          lng: shipment.originLng,
          label: 'SwagShip Warehouse, San Francisco, CA'
        },
        destination: {
          lat: shipment.destLat,
          lng: shipment.destLng,
          label: 'Delivery Address'
        },
        currentLocation: {
          lat: shipment.currentLat,
          lng: shipment.currentLng
        },
        progress: calculateProgress(shipment.status),
        route: generateRoute(shipment)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get shipment by tracking number
router.get('/track/:trackingNumber', async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber: req.params.trackingNumber },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Simulate progress
    const updatedShipment = await simulateShipmentProgress(shipment);

    res.json({
      shipment: {
        trackingNumber: updatedShipment.trackingNumber,
        carrier: updatedShipment.carrier,
        status: updatedShipment.status,
        statusLabel: formatStatus(updatedShipment.status),
        estimatedDelivery: updatedShipment.estimatedDelivery,
        lastUpdated: updatedShipment.lastUpdated,
        currentLocation: {
          lat: updatedShipment.currentLat,
          lng: updatedShipment.currentLng
        },
        progress: calculateProgress(updatedShipment.status)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get shipment location history (simulated)
router.get('/order/:orderId/history', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.orderId,
        userId: req.user.id
      },
      include: { shipment: true }
    });

    if (!order || !order.shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const shipment = order.shipment;
    const history = generateShipmentHistory(shipment, order.createdAt);

    res.json({ history });
  } catch (error) {
    next(error);
  }
});

// Helper functions

async function simulateShipmentProgress(shipment) {
  const hoursSinceCreated = (Date.now() - new Date(shipment.lastUpdated).getTime()) / (1000 * 60 * 60);

  let newStatus = shipment.status;
  let newLat = shipment.currentLat;
  let newLng = shipment.currentLng;

  // Progress status based on time
  if (hoursSinceCreated > 1 && shipment.status === 'processing') {
    newStatus = 'picked_up';
  } else if (hoursSinceCreated > 6 && shipment.status === 'picked_up') {
    newStatus = 'in_transit';
  } else if (hoursSinceCreated > 48 && shipment.status === 'in_transit') {
    newStatus = 'out_for_delivery';
  } else if (hoursSinceCreated > 72 && shipment.status === 'out_for_delivery') {
    newStatus = 'delivered';
  }

  // Update location based on progress
  const progress = calculateProgress(newStatus) / 100;
  newLat = shipment.originLat + (shipment.destLat - shipment.originLat) * progress;
  newLng = shipment.originLng + (shipment.destLng - shipment.originLng) * progress;

  // Add some variation
  if (newStatus !== 'delivered') {
    newLat += (Math.random() - 0.5) * 0.5;
    newLng += (Math.random() - 0.5) * 0.5;
  }

  // Update database if status changed
  if (newStatus !== shipment.status) {
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: newStatus,
        currentLat: newLat,
        currentLng: newLng,
        lastUpdated: new Date()
      }
    });
  }

  return {
    ...shipment,
    status: newStatus,
    currentLat: newLat,
    currentLng: newLng
  };
}

function formatStatus(status) {
  const labels = {
    processing: 'Processing',
    picked_up: 'Picked Up',
    in_transit: 'In Transit',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered'
  };
  return labels[status] || status;
}

function calculateProgress(status) {
  const progressMap = {
    processing: 10,
    picked_up: 25,
    in_transit: 50,
    out_for_delivery: 80,
    delivered: 100
  };
  return progressMap[status] || 0;
}

function generateRoute(shipment) {
  const steps = 10;
  const route = [];

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    route.push({
      lat: shipment.originLat + (shipment.destLat - shipment.originLat) * progress,
      lng: shipment.originLng + (shipment.destLng - shipment.originLng) * progress
    });
  }

  return route;
}

function generateShipmentHistory(shipment, orderCreatedAt) {
  const history = [];
  const orderDate = new Date(orderCreatedAt);

  history.push({
    status: 'Order Placed',
    location: 'Online',
    timestamp: orderDate.toISOString(),
    description: 'Order has been placed and confirmed'
  });

  const statusIndex = STATUS_PROGRESSION.indexOf(shipment.status);

  if (statusIndex >= 0) {
    const processingDate = new Date(orderDate.getTime() + 30 * 60 * 1000);
    history.push({
      status: 'Processing',
      location: 'SwagShip Warehouse, San Francisco, CA',
      timestamp: processingDate.toISOString(),
      description: 'Order is being prepared for shipment'
    });
  }

  if (statusIndex >= 1) {
    const pickedUpDate = new Date(orderDate.getTime() + 2 * 60 * 60 * 1000);
    history.push({
      status: 'Picked Up',
      location: 'SwagShip Warehouse, San Francisco, CA',
      timestamp: pickedUpDate.toISOString(),
      description: 'Package has been picked up by carrier'
    });
  }

  if (statusIndex >= 2) {
    const inTransitDate = new Date(orderDate.getTime() + 12 * 60 * 60 * 1000);
    history.push({
      status: 'In Transit',
      location: 'Distribution Center',
      timestamp: inTransitDate.toISOString(),
      description: 'Package is on its way'
    });
  }

  if (statusIndex >= 3) {
    const outForDeliveryDate = new Date(orderDate.getTime() + 48 * 60 * 60 * 1000);
    history.push({
      status: 'Out for Delivery',
      location: 'Local Delivery Facility',
      timestamp: outForDeliveryDate.toISOString(),
      description: 'Package is out for delivery'
    });
  }

  if (statusIndex >= 4) {
    const deliveredDate = new Date(orderDate.getTime() + 72 * 60 * 60 * 1000);
    history.push({
      status: 'Delivered',
      location: 'Delivery Address',
      timestamp: deliveredDate.toISOString(),
      description: 'Package has been delivered'
    });
  }

  return history.reverse();
}

export default router;
