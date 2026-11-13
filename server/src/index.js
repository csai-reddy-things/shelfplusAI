import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { isTwilioConfigured, fromWhatsApp, defaultDemoTo } from './config/whatsapp.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import demoSeedRoutes from './routes/demoSeedRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import billRoutes from './routes/billRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import expiryRoutes from './routes/expiryRoutes.js';
import restockRoutes from './routes/restockRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Cross-Origin Resource Sharing
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body Parsers with high limits for Base64 document images
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'ShelfPulse AI Backend',
    timestamp: new Date().toISOString(),
    aiEngine: 'gemini-2.5-flash (@google/genai)',
    whatsappGateway: {
      isTwilioConfigured,
      activeFrom: fromWhatsApp,
      fallbackMode: isTwilioConfigured ? 'TWILIO_LIVE' : 'DEMO_SIMULATED_WITH_WA_ME_DEEPLINK',
      defaultDemoRecipient: defaultDemoTo
    }
  });
});

// Mount API Routes
app.use('/api/demo', demoSeedRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/expiry', expiryRoutes);
app.use('/api/restock', restockRoutes);
app.use('/api/suppliers', supplierRoutes);

// Centralized Error Handling
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 ShelfPulse AI Backend running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Gemini Model: gemini-2.5-flash (Official @google/genai SDK)`);
  console.log(`📱 WhatsApp Mode: ${isTwilioConfigured ? 'LIVE TWILIO DISPATCH' : 'DEMO SIMULATION + WA.ME DEEP-LINK'}`);
  console.log(`======================================================\n`);
});

export default app;
