import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { ManualRestockTriggerSchema } from '../validators/schemas.js';
import { triggerRestockOrder } from '../services/whatsappRestockService.js';

const router = express.Router();

/**
 * POST /api/restock/trigger
 * Manually dispatches a WhatsApp restock purchase order for an item.
 */
router.post('/trigger', requireAuth, async (req, res, next) => {
  try {
    const { inventory_item_id, order_quantity, override_whatsapp_recipient } = ManualRestockTriggerSchema.parse(req.body);
    const userId = req.user.id;
    const client = req.supabase;

    // Fetch inventory item with supplier
    const { data: item, error: itemErr } = await client
      .from('inventory_items')
      .select('*, suppliers(*)')
      .eq('id', inventory_item_id)
      .eq('user_id', userId)
      .single();

    if (itemErr || !item) {
      return res.status(404).json({
        success: false,
        error: 'Target inventory item not found.'
      });
    }

    // Fetch store profile
    const { data: storeProfile } = await client
      .from('store_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const restockResult = await triggerRestockOrder({
      supabaseClient: client,
      userId,
      item,
      supplier: item.suppliers,
      storeProfile,
      orderQty: order_quantity || item.recommended_reorder_qty,
      triggerSource: 'MANUAL_ONE_CLICK',
      overrideRecipient: override_whatsapp_recipient,
      forceBypassDebounce: true // Always dispatch manual one-click orders immediately
    });

    return res.status(200).json({
      success: true,
      message: `WhatsApp restock order triggered for ${item.item_name}!`,
      data: restockResult
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/restock/orders
 * Returns full restock orders history for the authenticated store
 */
router.get('/orders', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const client = req.supabase;

    const { data: orders, error } = await client
      .from('restock_orders')
      .select('*, suppliers(supplier_name, whatsapp_number), inventory_items(item_name, category, batch_number)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      count: (orders || []).length,
      data: orders || []
    });
  } catch (err) {
    next(err);
  }
});

export default router;
