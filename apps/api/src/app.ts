import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRouter from './modules/health/health.route';
import authRouter from './modules/auth/auth.route';
import githubRouter from './modules/github/github.route';
import dashboardRouter from './modules/dashboard/dashboard.route';
import careerRouter from './modules/career/career.route';
import cookieParser from "cookie-parser";

const app: Express = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.use(healthRouter);
app.use((req, _res, next) => {
  console.log(">>>", req.method, req.originalUrl);
  next();
});
app.use(authRouter);
app.use(githubRouter);
app.use(dashboardRouter);
app.use(careerRouter);

// JSON errors instead of Express's default HTML page.
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('[api]', message);
    res.status(500).json({ error: message });
  },
);

export default app;
