import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey === 'your-google-gemini-api-key') {
  console.warn('⚠️ [ShelfPulse AI] GEMINI_API_KEY is missing or set to placeholder in server/.env. AI endpoints will require a valid key.');
}

// Strictly use the official @google/genai SDK
export const ai = new GoogleGenAI({ apiKey: apiKey || 'AIzaSy_Placeholder_For_Init' });
export const GEMINI_MODEL = 'gemini-2.5-flash';
export { Type };

export const SHELFPULSE_SYSTEM_INSTRUCTION = `You are ShelfPulse AI, an expert Hyperlocal Supermarket Operations, Inventory Vision, and Retail Supply Chain Assistant designed for neighborhood grocery stores, kirana shops, and minimarts.

Your core responsibilities are:
1. HIGH-PRECISION RECEIPT & SUPPLIER BILL OCR: Accurately read printed, thermal, or handwritten wholesale supplier invoices. Extract supplier name, invoice number, invoice date, and every line item (item name, quantity, unit, unit cost, selling price/MRP, batch number, and expiry date).
2. SMART SHELF-LIFE INFERENCE: When a wholesale bill does not explicitly print the expiry date for a line item, infer a realistic, conservative expiry date starting from the invoice date based on its product category (e.g., Fresh Milk/Pouches: +2 days, Bread/Bakery: +5 days, Packaged Curd/Paneer: +10 days, Snacks/Biscuits: +150 days, Staples/Grains: +240 days) and strictly set "is_expiry_estimated": true.
3. PRACTICAL CLEARANCE & MARKDOWN STRATEGY: Recommend actionable, street-smart promotional bundles (e.g., "Pair expiring bread with butter at 20% off", "Flash 30% evening discount on dairy") that maximize cash recovery before stock expires.
4. CRISP WHATSAPP SUPPLIER COMMUNICATION: Draft concise, polite, crystal-clear WhatsApp purchase order messages formatted with bullet points, exact SKU names, quantities, and delivery urgency so wholesale distributors can fulfill them immediately without follow-up calls.
Always respond strictly in valid JSON matching the requested schema.`;

// Bill extraction schema using official @google/genai Type
export const billExtractionSchema = {
  type: Type.OBJECT,
  properties: {
    supplier_name: { type: Type.STRING, description: "Extracted supplier or distributor name" },
    supplier_phone: { type: Type.STRING, description: "Extracted phone number if visible, else empty string" },
    invoice_number: { type: Type.STRING, description: "Invoice or bill reference number" },
    invoice_date: { type: Type.STRING, description: "Invoice date in YYYY-MM-DD format" },
    total_amount: { type: Type.NUMBER, description: "Total invoice amount in INR" },
    confidence_score: { type: Type.NUMBER, description: "Extraction confidence from 0.0 to 1.0" },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item_name: { type: Type.STRING },
          sku_code: { type: Type.STRING },
          category: {
            type: Type.STRING,
            enum: [
              "DAIRY_AND_CHILLED",
              "BAKERY_AND_BREADS",
              "SNACKS_AND_BISCUITS",
              "BEVERAGES_AND_JUICES",
              "STAPLES_AND_GRAINS",
              "INSTANT_AND_PACKAGED_FOOD",
              "PERSONAL_AND_HOME_CARE",
              "FRESH_PRODUCE"
            ]
          },
          batch_number: { type: Type.STRING },
          quantity_received: { type: Type.INTEGER },
          unit: { type: Type.STRING, enum: ["pcs", "packets", "kg", "liters", "boxes", "cartons"] },
          cost_price: { type: Type.NUMBER },
          selling_price: { type: Type.NUMBER },
          expiry_date: { type: Type.STRING, description: "YYYY-MM-DD" },
          is_expiry_estimated: { type: Type.BOOLEAN },
          min_stock_threshold: { type: Type.INTEGER },
          recommended_reorder_qty: { type: Type.INTEGER }
        },
        required: [
          "item_name",
          "category",
          "batch_number",
          "quantity_received",
          "unit",
          "cost_price",
          "selling_price",
          "expiry_date",
          "is_expiry_estimated",
          "min_stock_threshold",
          "recommended_reorder_qty"
        ]
      }
    }
  },
  required: ["supplier_name", "invoice_number", "invoice_date", "total_amount", "confidence_score", "items"]
};

// Expiry clearance and markdown advisor schema
export const expiryAdvisorySchema = {
  type: Type.OBJECT,
  properties: {
    total_at_risk_value: { type: Type.NUMBER },
    estimated_recoverable_value: { type: Type.NUMBER },
    summary_headline: { type: Type.STRING },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          inventory_item_id: { type: Type.STRING },
          item_name: { type: Type.STRING },
          days_left: { type: Type.INTEGER },
          recommended_discount_percent: { type: Type.INTEGER },
          new_promotional_price: { type: Type.NUMBER },
          clearance_tactic: { type: Type.STRING, description: "Actionable bundle or counter-display tactic" },
          whatsapp_promo_blurb: { type: Type.STRING, description: "Short broadcast message for neighborhood customer WhatsApp group" }
        },
        required: [
          "inventory_item_id",
          "item_name",
          "days_left",
          "recommended_discount_percent",
          "new_promotional_price",
          "clearance_tactic",
          "whatsapp_promo_blurb"
        ]
      }
    }
  },
  required: ["total_at_risk_value", "estimated_recoverable_value", "summary_headline", "recommendations"]
};

// WhatsApp restock order generator schema
export const whatsappRestockSchema = {
  type: Type.OBJECT,
  properties: {
    order_reference: { type: Type.STRING },
    whatsapp_message_body: { type: Type.STRING },
    urgency_level: { type: Type.STRING, enum: ["HIGH", "CRITICAL"] }
  },
  required: ["order_reference", "whatsapp_message_body", "urgency_level"]
};
