import { prisma } from "../../database/prisma.js";

import type { AuthenticatedGitHubUser } from "../github/github.types.js";

export async function saveGitHubUser(github: AuthenticatedGitHubUser) {
  const existingAccount = await prisma.gitHubAccount.findUnique({
    where: {
      githubId: github.githubId,
    },
    include: {
      user: true,
    },
  });

  if (existingAccount) {
    await prisma.gitHubAccount.update({
      where: {
        githubId: github.githubId,
      },
      data: {
        username: github.username,
        accessToken: github.accessToken,
        user: {
          update: {
            name: github.name,
            email: github.email,
            avatarUrl: github.avatarUrl,
          },
        },
      },
    });

    return prisma.user.findUniqueOrThrow({
      where: {
        id: existingAccount.user.id,
      },
      include: {
        github: true,
      },
    });
  }

  return prisma.user.create({
    data: {
      name: github.name,
      email: github.email,
      avatarUrl: github.avatarUrl,

      github: {
        create: {
          githubId: github.githubId,
          username: github.username,
          accessToken: github.accessToken,
        },
      },
    },

    include: {
      github: true,
    },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      github: true,
    },
  });
}
