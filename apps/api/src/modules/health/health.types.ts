export type HealthStatusValue = 'ok' | 'error';

export interface HealthStatus {
  status: HealthStatusValue;
  service: string;
  version: string;
  environment: string;
  uptime: number;
  timestamp: string;
}
