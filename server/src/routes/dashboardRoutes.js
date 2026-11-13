import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/dashboard/summary
 * Returns aggregated KPI metrics, expiry breakdown, and recent WhatsApp dispatch logs.
 */
router.get('/summary', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const client = req.supabase;

    // 1. Fetch Store Profile
    const { data: storeProfile } = await client
      .from('store_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // 2. Fetch all inventory items
    const { data: items, error: invError } = await client
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId);

    if (invError) throw invError;

    // 3. Fetch recent restock orders
    const { data: recentOrders, error: orderError } = await client
      .from('restock_orders')
      .select('*, suppliers(supplier_name, whatsapp_number)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(6);

    if (orderError) throw orderError;

    // 4. Compute KPIs
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalInventoryValue = 0;
    let totalItemsCount = 0;
    let lowStockCount = 0;
    let criticalExpiryCount = 0; // <= 3 days
    let warningExpiryCount = 0;  // 4-14 days
    let expiringWithin7DaysCount = 0;
    let expiredCount = 0;
    let nearExpiryAtRiskValue = 0;

    (items || []).forEach((item) => {
      totalItemsCount += 1;
      const currentQty = Number(item.current_quantity) || 0;
      const sellingPrice = Number(item.selling_price) || 0;
      const costPrice = Number(item.cost_price) || 0;

      totalInventoryValue += currentQty * sellingPrice;

      if (currentQty <= (item.min_stock_threshold || 5)) {
        lowStockCount += 1;
      }

      const expDate = new Date(item.expiry_date);
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0) {
        expiredCount += 1;
        nearExpiryAtRiskValue += currentQty * costPrice;
      } else if (daysLeft <= 3) {
        criticalExpiryCount += 1;
        expiringWithin7DaysCount += 1;
        nearExpiryAtRiskValue += currentQty * costPrice;
      } else if (daysLeft <= 7) {
        expiringWithin7DaysCount += 1;
        warningExpiryCount += 1;
        nearExpiryAtRiskValue += currentQty * costPrice;
      } else if (daysLeft <= 14) {
        warningExpiryCount += 1;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        storeProfile: storeProfile || {
          store_name: 'Apna Supermart',
          owner_name: req.user.user_metadata?.owner_name || 'Retail Manager',
          phone_number: '+919876543210',
          city: 'Bengaluru'
        },
        kpis: {
          totalActiveBatches: totalItemsCount,
          totalInventoryValue: Math.round(totalInventoryValue),
          expiringWithin7Days: expiringWithin7DaysCount,
          criticalExpiryCount,
          warningExpiryCount,
          expiredCount,
          nearExpiryAtRiskValue: Math.round(nearExpiryAtRiskValue),
          lowStockCount,
          totalRestockOrdersSent: (recentOrders || []).length
        },
        recentRestockOrders: recentOrders || []
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
