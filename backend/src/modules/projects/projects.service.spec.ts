import { ProjectActivityType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ProjectsService } from "./projects.service";

describe("ProjectsService", () => {
  it("records project creation in the same transaction", async () => {
    const project = {
      id: "project-1",
      title: "Projet de test",
      ownerId: "user-1",
    };
    const transaction = {
      project: { create: jest.fn().mockResolvedValue(project) },
      projectActivity: { create: jest.fn().mockResolvedValue({}) },
    };
    const transactionRunner = jest.fn(
      (callback: (tx: typeof transaction) => unknown) => callback(transaction),
    );
    const prisma = {
      $transaction: transactionRunner,
    } as unknown as PrismaService;
    const service = new ProjectsService(prisma);

    const result = await service.create("user-1", {
      title: "  Projet de test ",
      description: "Description assez longue pour respecter le contrat.",
    });

    expect(result).toBe(project);
    expect(transactionRunner.mock.calls).toHaveLength(1);
    expect(transaction.project.create.mock.calls).toContainEqual([
      {
        data: {
          title: "Projet de test",
          description: "Description assez longue pour respecter le contrat.",
          ownerId: "user-1",
        },
        include: { category: true },
      },
    ]);
    expect(transaction.projectActivity.create.mock.calls).toContainEqual([
      {
        data: {
          projectId: "project-1",
          actorId: "user-1",
          type: ProjectActivityType.PROJECT_CREATED,
          message: "Projet créé",
        },
      },
    ]);
  });
});
