import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' }, message: 'Mando API is running' });
});

app.listen(PORT, () => {
  console.log(`Mando API running on http://localhost:${PORT}`);
});

export default app;
