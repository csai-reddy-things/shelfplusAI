import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { SupplierCreateSchema } from '../validators/schemas.js';
import { normalizePhoneNumber } from '../config/whatsapp.js';

const router = express.Router();

/**
 * GET /api/suppliers
 * Lists all active suppliers for the authenticated store
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data: suppliers, error } = await req.supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', req.user.id)
      .order('supplier_name', { ascending: true });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: suppliers || []
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/suppliers
 * Creates a new supplier with validated E.164 WhatsApp number
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const validatedData = SupplierCreateSchema.parse(req.body);

    const payload = {
      user_id: req.user.id,
      supplier_name: validatedData.supplier_name.trim(),
      contact_person: validatedData.contact_person?.trim() || 'Sales Desk',
      whatsapp_number: normalizePhoneNumber(validatedData.whatsapp_number),
      primary_category: validatedData.primary_category,
      lead_time_hours: validatedData.lead_time_hours || 24,
      is_active: true
    };

    const { data: created, error } = await req.supabase
      .from('suppliers')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: 'Supplier successfully registered',
      data: created
    });
  } catch (err) {
    next(err);
  }
});

export default router;
