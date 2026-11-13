import { z } from 'zod';

export const CategoryEnum = z.enum([
  'DAIRY_AND_CHILLED',
  'BAKERY_AND_BREADS',
  'SNACKS_AND_BISCUITS',
  'BEVERAGES_AND_JUICES',
  'STAPLES_AND_GRAINS',
  'INSTANT_AND_PACKAGED_FOOD',
  'PERSONAL_AND_HOME_CARE',
  'FRESH_PRODUCE'
]);

export const UnitEnum = z.enum(['pcs', 'packets', 'kg', 'liters', 'boxes', 'cartons']);

export const SupplierCreateSchema = z.object({
  supplier_name: z.string().min(2).max(120),
  contact_person: z.string().optional().default('Sales Desk'),
  whatsapp_number: z.string().regex(/^\+[1-9]\d{9,14}$/, 'Must be a valid E.164 phone number starting with + (e.g. +919876543210)'),
  primary_category: CategoryEnum,
  lead_time_hours: z.number().int().min(1).max(168).default(24)
});

export const BillLineItemSchema = z.object({
  item_name: z.string().min(2),
  sku_code: z.string().optional().default(''),
  category: CategoryEnum,
  batch_number: z.string().min(1),
  quantity_received: z.number().int().min(1),
  unit: UnitEnum,
  cost_price: z.number().min(0),
  selling_price: z.number().min(0),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  is_expiry_estimated: z.boolean().default(false),
  min_stock_threshold: z.number().int().min(1).default(5),
  recommended_reorder_qty: z.number().int().min(1).default(20)
});

export const CommitBillSchema = z.object({
  supplier_id: z.string().uuid().nullable().optional(),
  supplier_name: z.string().min(2),
  supplier_phone: z.string().optional(),
  invoice_number: z.string().min(1),
  invoice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_amount: z.number().min(0),
  confidence_score: z.number().min(0).max(1).optional().default(0.95),
  items: z.array(BillLineItemSchema).min(1, 'At least one line item is required')
});

export const AdjustStockSchema = z.object({
  delta: z.number().int().refine((val) => val !== 0, 'Delta cannot be zero'),
  override_whatsapp_recipient: z.string().regex(/^\+[1-9]\d{9,14}$/, 'Must be a valid E.164 number').optional()
});

export const ManualRestockTriggerSchema = z.object({
  inventory_item_id: z.string().uuid(),
  order_quantity: z.number().int().min(1).optional(),
  override_whatsapp_recipient: z.string().regex(/^\+[1-9]\d{9,14}$/).optional()
});

export const DemoSeedSchema = z.object({
  demo_whatsapp_number: z.string().regex(/^\+[1-9]\d{9,14}$/, 'Must be a valid E.164 phone number').optional(),
  store_name: z.string().optional().default('Apna Supermart & Kirana'),
  owner_name: z.string().optional().default('Rajesh Kumar'),
  city: z.string().optional().default('Bengaluru')
});
