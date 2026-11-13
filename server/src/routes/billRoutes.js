import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/authMiddleware.js';
import { extractSupplierBillFromImage } from '../services/aiVisionService.js';
import { CommitBillSchema } from '../validators/schemas.js';

const router = express.Router();

// Strict multer memory storage configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Allowed formats: JPEG, PNG, WEBP.'), false);
    }
  }
});

// Rate limiting: max 30 AI vision scans per 15 minutes per IP
const scanRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many invoice scan requests from this IP. Please try again after 15 minutes.'
  }
});

/**
 * POST /api/bills/scan
 * Accepts multipart/form-data (billImage) or JSON base64; invokes Gemini 2.5 Flash Vision.
 */
router.post('/scan', requireAuth, scanRateLimiter, upload.single('billImage'), async (req, res, next) => {
  try {
    let imageBuffer = null;
    let mimeType = 'image/jpeg';
    let base64Data = null;

    if (req.file) {
      imageBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
    } else if (req.body?.base64Image) {
      base64Data = req.body.base64Image;
      mimeType = req.body.mimeType || 'image/jpeg';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Missing bill image. Please upload a file via multipart form or provide base64Image string.'
      });
    }

    console.log(`🔍 [Gemini Vision] Processing supplier bill scan for user: ${req.user.id}`);
    const extractedData = await extractSupplierBillFromImage({
      buffer: imageBuffer,
      mimeType,
      base64Data
    });

    return res.status(200).json({
      success: true,
      message: 'Supplier bill processed successfully by Gemini 2.5 Flash Vision',
      data: extractedData
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/bills/commit
 * Commits reviewed bill items into supplier_bills and inventory_items.
 */
router.post('/commit', requireAuth, async (req, res, next) => {
  try {
    const validatedBill = CommitBillSchema.parse(req.body);
    const userId = req.user.id;
    const client = req.supabase;

    let targetSupplierId = validatedBill.supplier_id;

    // If no supplier_id provided, attempt auto-match or create supplier
    if (!targetSupplierId && validatedBill.supplier_name) {
      const { data: matchedSupplier } = await client
        .from('suppliers')
        .select('id')
        .eq('user_id', userId)
        .ilike('supplier_name', validatedBill.supplier_name.trim())
        .maybeSingle();

      if (matchedSupplier) {
        targetSupplierId = matchedSupplier.id;
      } else {
        // Auto-provision supplier from invoice header
        const { data: newSupp } = await client
          .from('suppliers')
          .insert({
            user_id: userId,
            supplier_name: validatedBill.supplier_name.trim(),
            contact_person: 'Wholesale Billing Desk',
            whatsapp_number: validatedBill.supplier_phone || '+919876543210',
            primary_category: validatedBill.items[0]?.category || 'STAPLES_AND_GRAINS',
            lead_time_hours: 24,
            is_active: true
          })
          .select('id')
          .single();

        if (newSupp) {
          targetSupplierId = newSupp.id;
        }
      }
    }

    // 1. Insert into supplier_bills
    const { data: billRecord, error: billError } = await client
      .from('supplier_bills')
      .insert({
        user_id: userId,
        supplier_id: targetSupplierId || null,
        invoice_number: validatedBill.invoice_number,
        invoice_date: validatedBill.invoice_date,
        total_amount: validatedBill.total_amount,
        raw_extracted_json: validatedBill,
        scan_confidence_score: validatedBill.confidence_score || 0.95
      })
      .select('*')
      .single();

    if (billError) {
      throw new Error(`Failed to record supplier bill: ${billError.message}`);
    }

    // 2. Insert items into inventory_items
    const inventoryRows = validatedBill.items.map((item) => ({
      user_id: userId,
      supplier_id: targetSupplierId || null,
      source_bill_id: billRecord.id,
      item_name: item.item_name,
      sku_code: item.sku_code || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: item.category,
      batch_number: item.batch_number,
      current_quantity: item.quantity_received,
      unit: item.unit,
      cost_price: item.cost_price,
      selling_price: item.selling_price,
      min_stock_threshold: item.min_stock_threshold,
      recommended_reorder_qty: item.recommended_reorder_qty,
      expiry_date: item.expiry_date,
      is_expiry_estimated: item.is_expiry_estimated
    }));

    const { data: savedItems, error: itemsError } = await client
      .from('inventory_items')
      .insert(inventoryRows)
      .select('*');

    if (itemsError) {
      throw new Error(`Failed to sync inventory batches: ${itemsError.message}`);
    }

    return res.status(201).json({
      success: true,
      message: `Successfully synchronized ${savedItems.length} inventory items from invoice ${validatedBill.invoice_number}!`,
      data: {
        bill: billRecord,
        syncedItemsCount: savedItems.length,
        items: savedItems
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
