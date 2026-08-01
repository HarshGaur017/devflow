import type { HealthStatus } from './health.types.js';

export function getHealthStatus(): HealthStatus {
  const health: HealthStatus = {
    status: 'ok',
    service: 'devflow-api',
    version: process.env.npm_package_version ?? '0.0.0',
    environment: process.env.NODE_ENV ?? 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  return health;
}
