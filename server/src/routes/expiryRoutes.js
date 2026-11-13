import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { generateClearanceAdvisory } from '../services/aiClearanceService.js';

const router = express.Router();

/**
 * POST /api/expiry/advisory
 * Generates AI-driven markdown percentages, local bundle tactics, and WhatsApp promotional blurbs.
 */
router.post('/advisory', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const client = req.supabase;
    let itemsToAnalyze = req.body?.items;

    // If no items provided in request body, automatically pull all batches expiring within 14 days
    if (!Array.isArray(itemsToAnalyze) || itemsToAnalyze.length === 0) {
      const today = new Date();
      const fourteenDaysOut = new Date();
      fourteenDaysOut.setDate(fourteenDaysOut.getDate() + 14);

      const { data: nearExpiryBatches, error } = await client
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId)
        .gt('current_quantity', 0)
        .lte('expiry_date', fourteenDaysOut.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true });

      if (error) throw error;

      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);

      itemsToAnalyze = (nearExpiryBatches || []).map((b) => {
        const expDate = new Date(b.expiry_date);
        expDate.setHours(0, 0, 0, 0);
        const days = Math.ceil((expDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: b.id,
          item_name: b.item_name,
          category: b.category,
          batch_number: b.batch_number,
          current_quantity: b.current_quantity,
          unit: b.unit,
          cost_price: b.cost_price,
          selling_price: b.selling_price,
          expiry_date: b.expiry_date,
          days_until_expiry: days
        };
      });
    }

    if (itemsToAnalyze.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No near-expiry inventory batches found requiring clearance actions.',
        data: {
          total_at_risk_value: 0,
          estimated_recoverable_value: 0,
          summary_headline: "All shelf stock is in healthy range (> 14 days).",
          recommendations: []
        }
      });
    }

    console.log(`🧠 [Gemini Clearance] Generating advisory for ${itemsToAnalyze.length} near-expiry items...`);
    const advisoryResult = await generateClearanceAdvisory(itemsToAnalyze);

    // Optionally update items with latest AI clearance advice in DB
    if (advisoryResult.recommendations && advisoryResult.recommendations.length > 0) {
      for (const rec of advisoryResult.recommendations) {
        if (rec.inventory_item_id && !rec.inventory_item_id.startsWith('item-')) {
          await client
            .from('inventory_items')
            .update({ ai_clearance_advice: rec })
            .eq('id', rec.inventory_item_id)
            .eq('user_id', userId)
            .catch(() => {});
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'AI Clearance & Markdown strategy generated successfully',
      data: advisoryResult
    });
  } catch (err) {
    next(err);
  }
});

export default router;
