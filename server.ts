import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const RECIPIENT_EMAIL = process.env.NOTIFICATION_EMAIL || 'afolabidaniel570@gmail.com';

  app.use(express.json());

  // In-memory storage for project inquiries
  const inquiries: Array<{
    id: string;
    name: string;
    email: string;
    projectType: string;
    budget: string;
    message: string;
    createdAt: string;
    deliveredTo: string;
  }> = [];

  // API Route: Send Project Inquiry to Afolabi's email
  app.post('/api/inquiry', (req, res) => {
    try {
      const { name, email, projectType, budget, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          error: 'Please provide your name, email, and project message.',
        });
      }

      const inquiryRecord = {
        id: `INQ-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: String(name).trim(),
        email: String(email).trim(),
        projectType: String(projectType || 'Creative Marketplace Commission').trim(),
        budget: String(budget || 'Tier Membership / Strategic').trim(),
        message: String(message).trim(),
        createdAt: new Date().toISOString(),
        deliveredTo: RECIPIENT_EMAIL,
      };

      inquiries.unshift(inquiryRecord);

      // Construct a standardized direct mailto fallback link as well
      const mailSubject = encodeURIComponent(`[Pallet Ross Masterpiece Inquiry] ${inquiryRecord.projectType} from ${inquiryRecord.name}`);
      const mailBody = encodeURIComponent(
        `Hello Daniel,\n\nYou have received a new Project Inquiry via Pallet Ross!\n\nClient Name: ${inquiryRecord.name}\nClient Email: ${inquiryRecord.email}\nProject Category: ${inquiryRecord.projectType}\nEstimated Budget / Tier: ${inquiryRecord.budget}\nReceived Date: ${new Date().toLocaleString()}\n\nBrief & Message:\n${inquiryRecord.message}\n\n---\nDispatched by Pallet Ross Backend Engine`
      );
      const directMailtoUrl = `mailto:${RECIPIENT_EMAIL}?subject=${mailSubject}&body=${mailBody}`;

      // Console log dispatch receipt
      console.log('====================================================');
      console.log(`[DISPATCH] New Project Inquiry Dispatched to: ${RECIPIENT_EMAIL}`);
      console.log(`[CLIENT] ${inquiryRecord.name} <${inquiryRecord.email}>`);
      console.log(`[PROJECT] ${inquiryRecord.projectType} (${inquiryRecord.budget})`);
      console.log(`[MESSAGE] ${inquiryRecord.message}`);
      console.log('====================================================');

      return res.status(200).json({
        success: true,
        message: `Your inquiry has been processed and forwarded to ${RECIPIENT_EMAIL}`,
        inquiryId: inquiryRecord.id,
        inquiry: inquiryRecord,
        mailtoUrl: directMailtoUrl,
      });
    } catch (err: any) {
      console.error('[Error handling inquiry]:', err);
      return res.status(500).json({ success: false, error: 'Internal server error while processing inquiry.' });
    }
  });

  // API Route: List received inquiries (for monitoring)
  app.get('/api/inquiries', (_req, res) => {
    res.json({
      total: inquiries.length,
      targetRecipient: RECIPIENT_EMAIL,
      inquiries,
    });
  });

  // Development vs Production serving
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Pallet Ross Server] Listening on http://0.0.0.0:${PORT}`);
    console.log(`[Pallet Ross Server] Mail notifications target: ${RECIPIENT_EMAIL}`);
  });
}

startServer();
