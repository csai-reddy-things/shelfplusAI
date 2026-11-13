import { ai, GEMINI_MODEL, SHELFPULSE_SYSTEM_INSTRUCTION, expiryAdvisorySchema } from '../config/gemini.js';

/**
 * Generates an actionable clearance and markdown strategy for near-expiry batches using Gemini 2.5 Flash.
 */
export async function generateClearanceAdvisory(nearExpiryItems) {
  if (!Array.isArray(nearExpiryItems) || nearExpiryItems.length === 0) {
    return {
      total_at_risk_value: 0,
      estimated_recoverable_value: 0,
      summary_headline: "No near-expiry inventory items currently flagged.",
      recommendations: []
    };
  }

  const promptText = `Generate an immediate clearance and loss-prevention action plan for the following supermarket inventory items that are approaching expiry:
${JSON.stringify(nearExpiryItems, null, 2)}

For each item, calculate the recommended discount percentage, a concrete shelf-promotion or bundle tactic for local walk-in shoppers, the discounted selling price, and the estimated capital recovered if 85% of the batch sells after markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }]
        }
      ],
      config: {
        systemInstruction: SHELFPULSE_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: expiryAdvisorySchema,
        temperature: 0.2
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Gemini returned an empty advisory response.');
    }

    return JSON.parse(textOutput);
  } catch (error) {
    console.error('❌ Gemini Clearance Advisory failed or key missing:', error.message);
    console.warn('⚠️ Generating rule-based clearance plan as fallback.');
    return generateFallbackAdvisory(nearExpiryItems);
  }
}

/**
 * Generates a rule-based clearance advisory when Gemini API is offline or quota reached
 */
function generateFallbackAdvisory(items) {
  let totalAtRisk = 0;
  let totalRecoverable = 0;

  const recommendations = items.map((item) => {
    const daysLeft = typeof item.days_until_expiry === 'number' ? item.days_until_expiry : 5;
    const currentPrice = Number(item.selling_price) || 50;
    const quantity = Number(item.current_quantity) || 10;
    const itemValue = currentPrice * quantity;
    totalAtRisk += itemValue;

    let discount = 15;
    let tactic = "Place on 'Quick Grab' front basket near billing desk.";
    let promoBlurb = `⚡ Super Savings at Apna Supermart: Grab ${item.item_name} at flat 15% off today!`;

    if (daysLeft <= 1) {
      discount = 45;
      tactic = "Flash Evening Clearance: Buy 1 Get 1 Free or 45% Off at cashier counter.";
      promoBlurb = `🚨 URGENT FLASH SALE: Today only! Get ${item.item_name} at 45% OFF. Fresh stock clearance!`;
    } else if (daysLeft <= 3) {
      discount = 30;
      tactic = "Bundle Promo: Pair with everyday staples at 30% discount to clear batch within 24 hours.";
      promoBlurb = `🔥 Weekend Special: 30% OFF on ${item.item_name} while stocks last at Apna Supermart!`;
    } else if (daysLeft <= 7) {
      discount = 20;
      tactic = "Shelf-Talker Highlight: 'Fresh Batch Deals - 20% Off' yellow sticker.";
      promoBlurb = `🌟 Limited Period Deal: Save 20% on fresh ${item.item_name}. Visit today!`;
    }

    const discountedPrice = Math.max(1, Math.round(currentPrice * (1 - discount / 100)));
    const recoverable = Math.round(quantity * discountedPrice * 0.85);
    totalRecoverable += recoverable;

    return {
      inventory_item_id: item.id || 'item-sim',
      item_name: item.item_name,
      days_left: Math.max(0, daysLeft),
      recommended_discount_percent: discount,
      new_promotional_price: discountedPrice,
      clearance_tactic: tactic,
      whatsapp_promo_blurb: promoBlurb
    };
  });

  return {
    total_at_risk_value: Math.round(totalAtRisk),
    estimated_recoverable_value: Math.round(totalRecoverable),
    summary_headline: `Clearance Strategy for ${items.length} Batches: Recover up to ₹${Math.round(totalRecoverable)} capital`,
    recommendations
  };
}
