import { prisma } from "../../database/prisma.js";

export async function getGithubAccountByUserId(userId: string) {
  return prisma.gitHubAccount.findUnique({
    where: {
      userId,
    },
  });
}