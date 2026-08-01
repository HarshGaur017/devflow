import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRouter from './modules/health/health.route.js';
import authRouter from './modules/auth/auth.route.js';

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use(healthRouter);
app.use(authRouter);

export default app;
