import { ai, GEMINI_MODEL, SHELFPULSE_SYSTEM_INSTRUCTION, whatsappRestockSchema } from '../config/gemini.js';
import { sendWhatsAppMessage, normalizePhoneNumber } from '../config/whatsapp.js';

/**
 * Generates an automated WhatsApp restock order message using Gemini 2.5 Flash,
 * dispatches it via the WhatsApp engine (Twilio / live simulated fallback),
 * and logs it to public.restock_orders in Supabase.
 */
export async function triggerRestockOrder({
  supabaseClient,
  userId,
  item,
  supplier,
  storeProfile,
  orderQty = null,
  triggerSource = 'AUTO_LOW_STOCK',
  overrideRecipient = null,
  forceBypassDebounce = false
}) {
  const itemId = item.id;
  const itemName = item.item_name;
  const currentStock = item.current_quantity;
  const minThreshold = item.min_stock_threshold || 5;
  const qtyToOrder = orderQty || item.recommended_reorder_qty || 25;
  const unit = item.unit || 'pcs';

  // 1. Anti-spam Debounce Check (12 hours) for automated triggers
  if (!forceBypassDebounce && triggerSource === 'AUTO_LOW_STOCK') {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const { data: recentOrders, error: checkError } = await supabaseClient
      .from('restock_orders')
      .select('id, created_at, dispatch_status')
      .eq('inventory_item_id', itemId)
      .in('dispatch_status', ['SENT_LIVE', 'PENDING', 'DEMO_SIMULATED'])
      .gte('created_at', twelveHoursAgo)
      .limit(1);

    if (!checkError && recentOrders && recentOrders.length > 0) {
      console.log(`ℹ️ [WhatsApp Restock] Debounce active for item ${itemName} (${itemId}). Order already dispatched within last 12 hours.`);
      return {
        debounced: true,
        reason: 'Restock order already dispatched within the last 12 hours.',
        existingOrderId: recentOrders[0].id
      };
    }
  }

  // 2. Determine Supplier Details & Target WhatsApp Number
  const supplierName = supplier?.supplier_name || 'Wholesale Supplier Desk';
  const leadTimeHours = supplier?.lead_time_hours || 24;
  const rawRecipient = overrideRecipient || supplier?.whatsapp_number || storeProfile?.phone_number || '+919876543210';
  const recipientWhatsApp = normalizePhoneNumber(rawRecipient);

  const storeName = storeProfile?.store_name || 'Apna Supermart';
  const city = storeProfile?.city || 'Bengaluru';

  // 3. Generate structured restock message using Gemini 2.5 Flash
  let orderReference = `PO-${Date.now().toString(36).toUpperCase()}`;
  let messageBody = '';
  let urgencyLevel = currentStock <= 1 ? 'CRITICAL' : 'HIGH';

  const promptText = `Generate a professional, mobile-friendly WhatsApp restock order message from "${storeName}" (${city}) to supplier "${supplierName}".
Item Details:
- Product: ${itemName}
- Current Remaining Stock: ${currentStock} ${unit} (Below safety threshold of ${minThreshold} ${unit})
- Quantity to Order: ${qtyToOrder} ${unit}
- Required Delivery Window: Within ${leadTimeHours} hours

Include clear formatting with emojis suitable for WhatsApp, an order reference code, and a one-line confirmation prompt ("Reply YES to confirm dispatch").`;

  try {
    const aiResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      config: {
        systemInstruction: SHELFPULSE_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: whatsappRestockSchema,
        temperature: 0.2
      }
    });

    const parsed = JSON.parse(aiResponse.text);
    orderReference = parsed.order_reference || orderReference;
    messageBody = parsed.whatsapp_message_body;
    urgencyLevel = parsed.urgency_level || urgencyLevel;
  } catch (err) {
    console.error('❌ Gemini Restock Message generation failed or key missing:', err.message);
    // Bulletproof formatted fallback message in professional Hinglish/English retail tone
    messageBody = `📦 *URGENT RESTOCK PURCHASE ORDER*
🏪 *From:* ${storeName}, ${city}
👤 *To:* ${supplierName}
🔖 *PO Number:* #${orderReference}

⚠️ *Inventory Alert:*
• Item: *${itemName}*
• Remaining Stock: *${currentStock} ${unit}* (Min Safety: ${minThreshold})
• *Quantity Required: ${qtyToOrder} ${unit}*
• Expected Delivery: Within *${leadTimeHours} hrs*

Please confirm dispatch availability by replying *YES* to this message.
Thank you! 🙏`;
  }

  // 4. Dispatch WhatsApp message via Twilio / Simulated Engine
  const dispatchResult = await sendWhatsAppMessage({
    to: recipientWhatsApp,
    body: messageBody
  });

  // 5. Log record in public.restock_orders
  const orderRecord = {
    user_id: userId,
    inventory_item_id: itemId,
    supplier_id: supplier?.id || null,
    item_name_snapshot: itemName,
    current_stock_at_trigger: currentStock,
    ordered_quantity: qtyToOrder,
    unit: unit,
    recipient_whatsapp: recipientWhatsApp,
    whatsapp_message_body: messageBody,
    dispatch_status: dispatchResult.status,
    provider_message_sid: dispatchResult.providerSid,
    trigger_source: triggerSource
  };

  const { data: insertedOrder, error: insertError } = await supabaseClient
    .from('restock_orders')
    .insert(orderRecord)
    .select('*')
    .single();

  if (insertError) {
    console.error('❌ Failed to insert restock_order record:', insertError.message);
  }

  // 6. Update inventory_items.last_restock_triggered_at
  await supabaseClient
    .from('inventory_items')
    .update({ last_restock_triggered_at: new Date().toISOString() })
    .eq('id', itemId);

  return {
    debounced: false,
    order: insertedOrder || { ...orderRecord, id: `temp-${Date.now()}` },
    dispatch: dispatchResult,
    waMeLink: dispatchResult.waMeLink
  };
}
