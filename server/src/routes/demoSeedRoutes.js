import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { DemoSeedSchema } from '../validators/schemas.js';

const router = express.Router();

/**
 * POST /api/demo/seed
 * Populates realistic Indian Kirana/Supermarket suppliers and inventory batches,
 * configuring the demo/judge phone number as active supplier WhatsApp contact.
 */
router.post('/seed', requireAuth, async (req, res, next) => {
  try {
    const parsed = DemoSeedSchema.parse(req.body);
    const userId = req.user.id;
    const client = req.supabase;
    const targetPhone = parsed.demo_whatsapp_number || '+919876543210';

    console.log(`🌱 Seeding demo supermarket data for user ${userId} with WhatsApp contact ${targetPhone}`);

    // 1. Ensure Store Profile exists
    const { data: existingProfile } = await client
      .from('store_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!existingProfile) {
      await client.from('store_profiles').insert({
        id: userId,
        store_name: parsed.store_name,
        owner_name: parsed.owner_name,
        phone_number: targetPhone,
        city: parsed.city,
        auto_whatsapp_enabled: true
      });
    } else {
      await client.from('store_profiles').update({
        phone_number: targetPhone,
        store_name: parsed.store_name || existingProfile.store_name
      }).eq('id', userId);
    }

    // 2. Clear existing demo data if requested or keep fresh
    await client.from('inventory_items').delete().eq('user_id', userId);
    await client.from('suppliers').delete().eq('user_id', userId);

    // 3. Insert Realistic Suppliers
    const suppliersData = [
      {
        user_id: userId,
        supplier_name: 'Anand FMCG & Dairy Wholesalers',
        contact_person: 'Suresh Anand (Sales Head)',
        whatsapp_number: targetPhone,
        primary_category: 'DAIRY_AND_CHILLED',
        lead_time_hours: 12,
        is_active: true
      },
      {
        user_id: userId,
        supplier_name: 'Sri Krishna Fresh Bakery Depot',
        contact_person: 'Ramesh Bakery Desk',
        whatsapp_number: targetPhone,
        primary_category: 'BAKERY_AND_BREADS',
        lead_time_hours: 18,
        is_active: true
      },
      {
        user_id: userId,
        supplier_name: 'Metro Cash & Carry Super Distributors',
        contact_person: 'Vikram Wholesale Mgr',
        whatsapp_number: targetPhone,
        primary_category: 'INSTANT_AND_PACKAGED_FOOD',
        lead_time_hours: 24,
        is_active: true
      },
      {
        user_id: userId,
        supplier_name: 'Hindustan Consumer Goods Depot',
        contact_person: 'Kavitha Distribution Hub',
        whatsapp_number: targetPhone,
        primary_category: 'PERSONAL_AND_HOME_CARE',
        lead_time_hours: 36,
        is_active: true
      }
    ];

    const { data: createdSuppliers, error: suppError } = await client
      .from('suppliers')
      .insert(suppliersData)
      .select('*');

    if (suppError) {
      throw new Error(`Failed to seed suppliers: ${suppError.message}`);
    }

    const dairySupplier = createdSuppliers.find(s => s.primary_category === 'DAIRY_AND_CHILLED') || createdSuppliers[0];
    const bakerySupplier = createdSuppliers.find(s => s.primary_category === 'BAKERY_AND_BREADS') || createdSuppliers[0];
    const fmcgSupplier = createdSuppliers.find(s => s.primary_category === 'INSTANT_AND_PACKAGED_FOOD') || createdSuppliers[0];
    const personalSupplier = createdSuppliers.find(s => s.primary_category === 'PERSONAL_AND_HOME_CARE') || createdSuppliers[0];

    // Helper for relative date YYYY-MM-DD
    const getFutureDate = (days) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    // 4. Insert Realistic Indian Supermarket Inventory Batches
    const inventoryData = [
      // CRITICAL EXPIRY (1-3 days)
      {
        user_id: userId,
        supplier_id: dairySupplier.id,
        item_name: 'Amul Taaza Homogenised Toned Milk 500ml',
        sku_code: 'AMUL-TZ-500',
        category: 'DAIRY_AND_CHILLED',
        batch_number: 'BAT-AML-902',
        current_quantity: 16,
        unit: 'packets',
        cost_price: 26.50,
        selling_price: 29.00,
        min_stock_threshold: 8,
        recommended_reorder_qty: 40,
        expiry_date: getFutureDate(2),
        is_expiry_estimated: false
      },
      {
        user_id: userId,
        supplier_id: bakerySupplier.id,
        item_name: 'Modern Classic Sliced White Bread 400g',
        sku_code: 'MOD-BREAD-400',
        category: 'BAKERY_AND_BREADS',
        batch_number: 'BAT-MOD-108',
        current_quantity: 11,
        unit: 'packets',
        cost_price: 34.00,
        selling_price: 42.00,
        min_stock_threshold: 5,
        recommended_reorder_qty: 25,
        expiry_date: getFutureDate(3),
        is_expiry_estimated: true
      },
      {
        user_id: userId,
        supplier_id: dairySupplier.id,
        item_name: 'Mother Dairy Fresh Paneer Pouch 200g',
        sku_code: 'MD-PAN-200',
        category: 'DAIRY_AND_CHILLED',
        batch_number: 'BAT-MDP-411',
        current_quantity: 8,
        unit: 'packets',
        cost_price: 78.00,
        selling_price: 92.00,
        min_stock_threshold: 5,
        recommended_reorder_qty: 20,
        expiry_date: getFutureDate(3),
        is_expiry_estimated: false
      },

      // WARNING EXPIRY (4-14 days)
      {
        user_id: userId,
        supplier_id: dairySupplier.id,
        item_name: 'Amul Masti Spiced Buttermilk 200ml Tetra',
        sku_code: 'AMUL-BUT-200',
        category: 'DAIRY_AND_CHILLED',
        batch_number: 'BAT-AMB-304',
        current_quantity: 24,
        unit: 'packets',
        cost_price: 12.00,
        selling_price: 15.00,
        min_stock_threshold: 10,
        recommended_reorder_qty: 60,
        expiry_date: getFutureDate(6),
        is_expiry_estimated: false
      },
      {
        user_id: userId,
        supplier_id: fmcgSupplier.id,
        item_name: 'Real Fruit Power Mixed Fruit Juice 1L',
        sku_code: 'REAL-JUICE-1L',
        category: 'BEVERAGES_AND_JUICES',
        batch_number: 'BAT-RF-819',
        current_quantity: 14,
        unit: 'boxes',
        cost_price: 95.00,
        selling_price: 130.00,
        min_stock_threshold: 6,
        recommended_reorder_qty: 24,
        expiry_date: getFutureDate(11),
        is_expiry_estimated: true
      },

      // STAGE DEMO SALE SIMULATOR TARGETS (Near safety threshold)
      {
        user_id: userId,
        supplier_id: fmcgSupplier.id,
        item_name: 'Maggi 2-Minute Masala Noodles 70g (Pack of 4)',
        sku_code: 'MAGGI-4P-280',
        category: 'INSTANT_AND_PACKAGED_FOOD',
        batch_number: 'BAT-MAG-552',
        current_quantity: 6, // 1 sale (-5) drops it to 1, immediately breaching min threshold 5!
        unit: 'packets',
        cost_price: 48.00,
        selling_price: 58.00,
        min_stock_threshold: 5,
        recommended_reorder_qty: 35,
        expiry_date: getFutureDate(160),
        is_expiry_estimated: false
      },
      {
        user_id: userId,
        supplier_id: fmcgSupplier.id,
        item_name: "Lay's India's Magic Masala Potato Chips 50g",
        sku_code: 'LAYS-MM-50',
        category: 'SNACKS_AND_BISCUITS',
        batch_number: 'BAT-LAY-321',
        current_quantity: 7, // Sale simulation drops below 5
        unit: 'packets',
        cost_price: 16.00,
        selling_price: 20.00,
        min_stock_threshold: 5,
        recommended_reorder_qty: 40,
        expiry_date: getFutureDate(95),
        is_expiry_estimated: false
      },

      // HEALTHY & STAPLES
      {
        user_id: userId,
        supplier_id: fmcgSupplier.id,
        item_name: 'Aashirvaad Superior MP Sharbati Atta 5kg',
        sku_code: 'AASH-ATTA-5KG',
        category: 'STAPLES_AND_GRAINS',
        batch_number: 'BAT-ASH-771',
        current_quantity: 18,
        unit: 'packets',
        cost_price: 260.00,
        selling_price: 315.00,
        min_stock_threshold: 8,
        recommended_reorder_qty: 30,
        expiry_date: getFutureDate(210),
        is_expiry_estimated: false
      },
      {
        user_id: userId,
        supplier_id: fmcgSupplier.id,
        item_name: 'Tata Salt Vacuum Evaporated Iodised Salt 1kg',
        sku_code: 'TATA-SALT-1K',
        category: 'STAPLES_AND_GRAINS',
        batch_number: 'BAT-TAT-201',
        current_quantity: 32,
        unit: 'packets',
        cost_price: 22.00,
        selling_price: 28.00,
        min_stock_threshold: 10,
        recommended_reorder_qty: 50,
        expiry_date: getFutureDate(360),
        is_expiry_estimated: false
      },
      {
        user_id: userId,
        supplier_id: personalSupplier.id,
        item_name: 'Dettol Original Germ Protection Liquid Handwash 200ml Refill',
        sku_code: 'DET-HW-200',
        category: 'PERSONAL_AND_HOME_CARE',
        batch_number: 'BAT-DET-994',
        current_quantity: 20,
        unit: 'packets',
        cost_price: 42.00,
        selling_price: 52.00,
        min_stock_threshold: 6,
        recommended_reorder_qty: 30,
        expiry_date: getFutureDate(400),
        is_expiry_estimated: false
      }
    ];

    const { data: createdInventory, error: invError } = await client
      .from('inventory_items')
      .insert(inventoryData)
      .select('*');

    if (invError) {
      throw new Error(`Failed to seed inventory batches: ${invError.message}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Demo Supermarket successfully populated with realistic inventory and suppliers!',
      data: {
        suppliersCount: createdSuppliers.length,
        itemsCount: createdInventory.length,
        demoWhatsAppTarget: targetPhone,
        stageTargetItems: createdInventory.filter(i => i.current_quantity <= 7).map(i => ({
          name: i.item_name,
          stock: i.current_quantity,
          threshold: i.min_stock_threshold
        }))
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
