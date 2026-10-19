import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { isPrismaErrorCode } from "../prisma/prisma-errors";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

function categorySlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(includeInactive = false) {
    return this.prisma.category.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async create(input: CreateCategoryDto) {
    const slug = categorySlug(input.slug ?? input.name);
    if (!slug) {
      throw new BadRequestException(
        "Category slug must contain letters or numbers",
      );
    }
    try {
      return await this.prisma.category.create({
        data: {
          name: input.name.trim(),
          slug,
          description: input.description,
          isActive: input.isActive,
        },
      });
    } catch (error) {
      if (isPrismaErrorCode(error, "P2002")) {
        throw new ConflictException("A category with this slug already exists");
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateCategoryDto) {
    const slugSource = input.slug ?? input.name;
    const slug =
      slugSource === undefined ? undefined : categorySlug(slugSource);
    if (slugSource !== undefined && !slug) {
      throw new BadRequestException(
        "Category slug must contain letters or numbers",
      );
    }
    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...input,
          ...(slug !== undefined ? { slug } : {}),
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        },
      });
    } catch (error) {
      if (isPrismaErrorCode(error, "P2002")) {
        throw new ConflictException("A category with this slug already exists");
      }
      if (isPrismaErrorCode(error, "P2025")) {
        throw new NotFoundException("Category not found");
      }
      throw error;
    }
  }

  async delete(id: string) {
    try {
      await this.prisma.category.delete({ where: { id } });
      return { deleted: true };
    } catch (error) {
      if (isPrismaErrorCode(error, "P2025")) {
        throw new NotFoundException("Category not found");
      }
      throw error;
    }
  }
}
