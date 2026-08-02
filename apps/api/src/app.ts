import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRouter from './modules/health/health.route';
import authRouter from './modules/auth/auth.route';
import githubRouter from './modules/github/github.route';
import dashboardRouter from './modules/dashboard/dashboard.route';
import cookieParser from "cookie-parser";

const app: Express = express();

app.use(helmet());
app.use(cors());
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
export default app;
