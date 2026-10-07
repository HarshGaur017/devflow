import { prisma } from "../../database/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import type { CareerStatsDto } from "./career.dto.js";
import type { CareerSynthesis } from "./career.schema.js";

/** A scan still marked RUNNING after this long is assumed dead (process restart). */
export const STALE_SCAN_MS = 30 * 60 * 1000;

export async function createScan(
  userId: string,
  windowStart: Date,
  windowEnd: Date,
) {
  return prisma.careerScan.create({
    data: {
      userId,
      windowStart,
      windowEnd,
      status: "PENDING",
    },
  });
}

export async function findScanById(id: string, userId: string) {
  return prisma.careerScan.findFirst({
    where: { id, userId },
  });
}

/** A PENDING or RUNNING scan that has not gone stale. */
export async function findActiveScan(userId: string) {
  return prisma.careerScan.findFirst({
    where: {
      userId,
      status: { in: ["PENDING", "RUNNING"] },
      updatedAt: { gt: new Date(Date.now() - STALE_SCAN_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * The scan runs in-process, so a server restart can leave a row stuck in
 * RUNNING forever. Retire those before starting anything new.
 */
export async function failStaleScans(userId: string) {
  const { count } = await prisma.careerScan.updateMany({
    where: {
      userId,
      status: { in: ["PENDING", "RUNNING"] },
      updatedAt: { lte: new Date(Date.now() - STALE_SCAN_MS) },
    },
    data: {
      status: "FAILED",
      error: "The scan stopped unexpectedly (the API process restarted). Run it again.",
      completedAt: new Date(),
    },
  });

  return count;
}

export async function findLatestCompletedScan(userId: string) {
  return prisma.careerScan.findFirst({
    where: { userId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
  });
}

export async function markScanRunning(id: string, totalRepos: number) {
  return prisma.careerScan.update({
    where: { id },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
      totalRepos,
      processedRepos: 0,
    },
  });
}

export async function updateScanProgress(
  id: string,
  processedRepos: number,
  currentRepo: string | null,
) {
  return prisma.careerScan.update({
    where: { id },
    data: { processedRepos, currentRepo },
  });
}

export async function markScanCompleted(
  id: string,
  stats: CareerStatsDto,
  synthesis: CareerSynthesis | null,
  aiDriver: string,
  warning: string | null,
) {
  return prisma.careerScan.update({
    where: { id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      currentRepo: null,
      stats: stats as unknown as Prisma.InputJsonValue,
      synthesis: synthesis
        ? (synthesis as unknown as Prisma.InputJsonValue)
        : Prisma.DbNull,
      aiDriver,
      warning,
    },
  });
}

export async function markScanFailed(id: string, message: string) {
  return prisma.careerScan.update({
    where: { id },
    data: {
      status: "FAILED",
      completedAt: new Date(),
      currentRepo: null,
      error: message.slice(0, 1000),
    },
  });
}
