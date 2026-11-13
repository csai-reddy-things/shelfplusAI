import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { AdjustStockSchema } from '../validators/schemas.js';
import { triggerRestockOrder } from '../services/whatsappRestockService.js';

const router = express.Router();

/**
 * GET /api/inventory
 * Lists all inventory batches with computed expiry horizons, status flags, and supplier info.
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { category, status, search } = req.query;
    const userId = req.user.id;
    const client = req.supabase;

    let query = client
      .from('inventory_items')
      .select('*, suppliers(id, supplier_name, whatsapp_number, lead_time_hours)')
      .eq('user_id', userId)
      .order('expiry_date', { ascending: true });

    if (category && category !== 'ALL') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`item_name.ilike.%${search}%,batch_number.ilike.%${search}%,sku_code.ilike.%${search}%`);
    }

    const { data: rawItems, error } = await query;
    if (error) {
      throw error;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Compute live expiry horizons & stock alert flags
    const computedItems = (rawItems || []).map((item) => {
      const expDate = new Date(item.expiry_date);
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let expiryStatus = 'HEALTHY';
      if (daysUntilExpiry <= 0) {
        expiryStatus = 'EXPIRED';
      } else if (daysUntilExpiry <= 3) {
        expiryStatus = 'CRITICAL';
      } else if (daysUntilExpiry <= 14) {
        expiryStatus = 'WARNING';
      }

      const isLowStock = item.current_quantity <= item.min_stock_threshold;

      return {
        ...item,
        days_until_expiry: daysUntilExpiry,
        expiry_status: expiryStatus,
        is_low_stock: isLowStock
      };
    });

    // Apply status filter in-memory if requested
    let finalItems = computedItems;
    if (status && status !== 'ALL') {
      if (status === 'LOW_STOCK') {
        finalItems = computedItems.filter((i) => i.is_low_stock);
      } else {
        finalItems = computedItems.filter((i) => i.expiry_status === status);
      }
    }

    return res.status(200).json({
      success: true,
      count: finalItems.length,
      data: finalItems
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/inventory/:id/adjust-stock
 * Adjusts quantity (e.g., -1 customer sale, -5 rush sale).
 * If new stock <= min_stock_threshold, triggers Gemini + WhatsApp Restock Engine in real time.
 */
router.patch('/:id/adjust-stock', requireAuth, async (req, res, next) => {
  try {
    const itemId = req.params.id;
    const { delta, override_whatsapp_recipient } = AdjustStockSchema.parse(req.body);
    const userId = req.user.id;
    const client = req.supabase;

    // 1. Fetch current item details with supplier
    const { data: item, error: fetchErr } = await client
      .from('inventory_items')
      .select('*, suppliers(id, supplier_name, whatsapp_number, lead_time_hours)')
      .eq('id', itemId)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !item) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found.'
      });
    }

    const previousQuantity = item.current_quantity;
    const newQuantity = Math.max(0, previousQuantity + delta);

    // 2. Update stock quantity
    const { data: updatedItem, error: updateErr } = await client
      .from('inventory_items')
      .update({
        current_quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select('*, suppliers(id, supplier_name, whatsapp_number, lead_time_hours)')
      .single();

    if (updateErr) {
      throw updateErr;
    }

    let restockTriggered = false;
    let restockResult = null;

    // 3. Evaluate safety threshold condition
    const isBelowThreshold = newQuantity <= updatedItem.min_stock_threshold;
    if (isBelowThreshold) {
      console.log(`⚠️ [Low Stock Alert] Item "${updatedItem.item_name}" dropped to ${newQuantity} (Threshold: ${updatedItem.min_stock_threshold}). Triggering auto-restock...`);

      // Fetch store profile for WhatsApp template branding
      const { data: storeProfile } = await client
        .from('store_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Trigger WhatsApp Restock Order
      restockResult = await triggerRestockOrder({
        supabaseClient: client,
        userId,
        item: updatedItem,
        supplier: updatedItem.suppliers,
        storeProfile,
        orderQty: updatedItem.recommended_reorder_qty,
        triggerSource: 'AUTO_LOW_STOCK',
        overrideRecipient: override_whatsapp_recipient,
        forceBypassDebounce: false
      });

      restockTriggered = true;
    }

    return res.status(200).json({
      success: true,
      message: `Stock updated from ${previousQuantity} to ${newQuantity} ${updatedItem.unit}`,
      data: {
        item: updatedItem,
        previousQuantity,
        newQuantity,
        delta,
        isBelowThreshold,
        restockTriggered,
        restockDetails: restockResult
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
