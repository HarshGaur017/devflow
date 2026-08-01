import { prisma } from "../../database/prisma";

export async function getHealthStatus() {
  await prisma.$queryRaw`SELECT 1`;

  return {
    status: "ok",
    service: "devflow-api",
    database: "connected",
    timestamp: new Date().toISOString(),
  };
}