import { Injectable, NotFoundException } from "@nestjs/common";
import { OpportunityStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { isPrismaErrorCode } from "../prisma/prisma-errors";
import { CreateOpportunityDto } from "./dto/create-opportunity.dto";
import { ListOpportunitiesDto } from "./dto/list-opportunities.dto";
import { UpdateOpportunityDto } from "./dto/update-opportunity.dto";

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  listPublic(filters: ListOpportunitiesDto) {
    const searchTerm = filters.search?.trim();

    return this.prisma.opportunity.findMany({
      where: {
        status: OpportunityStatus.PUBLISHED,
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        AND: [
          { OR: [{ deadline: null }, { deadline: { gt: new Date() } }] },
          ...(searchTerm
            ? [
                {
                  OR: [
                    {
                      title: {
                        contains: searchTerm,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      organization: {
                        contains: searchTerm,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      description: {
                        contains: searchTerm,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      location: {
                        contains: searchTerm,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                },
              ]
            : []),
        ],
      },
      include: { category: true },
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
    });
  }

  async getPublic(id: string) {
    const opportunity = await this.prisma.opportunity.findFirst({
      where: {
        id,
        status: OpportunityStatus.PUBLISHED,
        OR: [{ deadline: null }, { deadline: { gt: new Date() } }],
      },
      include: { category: true },
    });
    if (!opportunity) {
      throw new NotFoundException("Opportunity not found");
    }
    return opportunity;
  }

  listAdmin() {
    return this.prisma.opportunity.findMany({
      include: { category: true, _count: { select: { applications: true } } },
      orderBy: { updatedAt: "desc" },
    });
  }

  async create(input: CreateOpportunityDto) {
    await this.assertCategory(input.categoryId);
    return this.prisma.opportunity.create({
      data: {
        ...input,
        title: input.title.trim(),
        organization: input.organization.trim(),
        ...(input.deadline !== undefined
          ? { deadline: input.deadline ? new Date(input.deadline) : null }
          : {}),
      },
      include: { category: true },
    });
  }

  async update(id: string, input: UpdateOpportunityDto) {
    await this.assertCategory(input.categoryId);
    try {
      return await this.prisma.opportunity.update({
        where: { id },
        data: {
          ...input,
          ...(input.title !== undefined ? { title: input.title.trim() } : {}),
          ...(input.organization !== undefined
            ? { organization: input.organization.trim() }
            : {}),
          ...(input.deadline !== undefined
            ? { deadline: input.deadline ? new Date(input.deadline) : null }
            : {}),
        },
        include: { category: true },
      });
    } catch (error) {
      if (isPrismaErrorCode(error, "P2025")) {
        throw new NotFoundException("Opportunity not found");
      }
      throw error;
    }
  }

  private async assertCategory(categoryId?: string | null) {
    if (!categoryId) {
      return;
    }
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, isActive: true },
      select: { id: true },
    });
    if (!category) {
      throw new NotFoundException("Active category not found");
    }
  }
}
