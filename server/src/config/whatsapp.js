import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
const defaultDemoTo = process.env.DEFAULT_DEMO_WHATSAPP_TO || '+919876543210';

let twilioClient = null;
const isTwilioConfigured = Boolean(
  accountSid &&
  authToken &&
  accountSid.startsWith('AC') &&
  accountSid.length >= 30 &&
  !accountSid.includes('xxxx')
);

if (isTwilioConfigured) {
  try {
    twilioClient = twilio(accountSid, authToken);
    console.log('✅ Twilio WhatsApp REST client initialized.');
  } catch (err) {
    console.warn('⚠️ Twilio initialization warning:', err.message);
  }
} else {
  console.log('ℹ️ Twilio credentials not configured or using placeholders. Defaulting to DEMO_SIMULATED WhatsApp mode with instant wa.me deep links.');
}

/**
 * Normalizes an E.164 phone number string.
 * Strips whitespace, dashes, and ensures a leading '+'
 */
export function normalizePhoneNumber(rawNumber) {
  if (!rawNumber) return defaultDemoTo;
  let cleaned = String(rawNumber).replace(/[\s\-\(\)]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

/**
 * Formats an E.164 number into Twilio's required "whatsapp:+<number>" format
 */
export function formatTwilioWhatsAppAddress(e164Number) {
  const norm = normalizePhoneNumber(e164Number);
  return norm.startsWith('whatsapp:') ? norm : `whatsapp:${norm}`;
}

/**
 * Generates an instant WhatsApp Click-to-Chat deep link (wa.me)
 * This allows a presenter or judge to click and instantly open WhatsApp Web/App
 * with the pre-filled restock message even if Twilio sandbox is not joined.
 */
export function generateWaMeDeepLink(rawNumber, messageBody) {
  const norm = normalizePhoneNumber(rawNumber).replace('+', '');
  const encodedText = encodeURIComponent(messageBody);
  return `https://wa.me/${norm}?text=${encodedText}`;
}

/**
 * Dispatches a WhatsApp restock order message.
 * Attempts live delivery via Twilio if configured;
 * otherwise gracefully logs DEMO_SIMULATED and returns the payload + wa.me link.
 */
export async function sendWhatsAppMessage({ to, body }) {
  const normalizedTo = normalizePhoneNumber(to);
  const waMeLink = generateWaMeDeepLink(normalizedTo, body);

  if (isTwilioConfigured && twilioClient) {
    try {
      const recipientAddress = formatTwilioWhatsAppAddress(normalizedTo);
      const message = await twilioClient.messages.create({
        from: fromWhatsApp,
        to: recipientAddress,
        body: body
      });

      console.log(`📱 [Twilio WhatsApp] Dispatched live message SID: ${message.sid} to ${recipientAddress}`);
      return {
        success: true,
        status: 'SENT_LIVE',
        providerSid: message.sid,
        recipient: normalizedTo,
        waMeLink,
        messageBody: body,
        mode: 'LIVE_TWILIO'
      };
    } catch (error) {
      console.warn(`⚠️ [Twilio WhatsApp] Live delivery warning: ${error.message}. Falling back to DEMO_SIMULATED.`);
      return {
        success: true,
        status: 'DEMO_SIMULATED',
        providerSid: `DEMO-ERR-${Date.now().toString(36).toUpperCase()}`,
        recipient: normalizedTo,
        waMeLink,
        messageBody: body,
        mode: 'DEMO_FALLBACK',
        deliveryNote: error.message
      };
    }
  }

  // Graceful DEMO_SIMULATED fallback
  const demoSid = `DEMO-SIM-${Date.now().toString(36).toUpperCase()}`;
  console.log(`📱 [WhatsApp Engine] Simulated WhatsApp order dispatched to ${normalizedTo}. SID: ${demoSid}`);
  return {
    success: true,
    status: 'DEMO_SIMULATED',
    providerSid: demoSid,
    recipient: normalizedTo,
    waMeLink,
    messageBody: body,
    mode: 'DEMO_SIMULATED'
  };
}

export { isTwilioConfigured, fromWhatsApp, defaultDemoTo };
