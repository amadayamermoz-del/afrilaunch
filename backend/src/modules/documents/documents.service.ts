import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { basename } from "node:path";
import { PrismaService } from "../prisma/prisma.service";
import { isPrismaErrorCode } from "../prisma/prisma-errors";
import { DocumentStorageService } from "./document-storage.service";

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: DocumentStorageService,
  ) {}

  async listMine(ownerId: string) {
    const documents = await this.prisma.document.findMany({
      where: { ownerId },
      include: { project: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    });
    return documents.map((document) => this.toResponse(document));
  }

  async create(
    ownerId: string,
    file: Express.Multer.File | undefined,
    projectId?: string,
  ) {
    if (!file) {
      throw new BadRequestException("A document file is required");
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      throw new BadRequestException("Documents must be 10 MB or smaller");
    }
    if (!this.storage.isAllowedMimeType(file.mimetype)) {
      throw new BadRequestException(
        "Only PDF, Word, JPEG, and PNG files are allowed",
      );
    }

    if (projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: projectId, ownerId },
        select: { id: true },
      });
      if (!project) {
        throw new NotFoundException("Owned project not found");
      }
    }

    const storageKey = await this.storage.save(file.buffer, file.mimetype);
    try {
      const document = await this.prisma.document.create({
        data: {
          ownerId,
          projectId: projectId || null,
          name:
            basename(file.originalname.replace(/\\/g, "/"))
              .replace(/[\u0000-\u001f\u007f]/g, "")
              .slice(0, 255) || "document",
          mimeType: file.mimetype,
          storageKey,
          sizeBytes: BigInt(file.size),
        },
        include: { project: { select: { id: true, title: true } } },
      });
      return this.toResponse(document);
    } catch (error) {
      await this.storage.remove(storageKey);
      if (isPrismaErrorCode(error, "P2003")) {
        throw new NotFoundException("Project not found");
      }
      throw error;
    }
  }

  async getForDownload(id: string, userId: string, role: UserRole) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) {
      throw new NotFoundException("Document not found");
    }
    if (document.ownerId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException("You cannot access this document");
    }
    return {
      filePath: await this.storage.getFilePath(document.storageKey),
      name: document.name,
      mimeType: document.mimeType,
    };
  }

  async delete(id: string, userId: string, role: UserRole) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) {
      throw new NotFoundException("Document not found");
    }
    if (document.ownerId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException("You cannot delete this document");
    }

    await this.storage.remove(document.storageKey);
    await this.prisma.document.delete({ where: { id } });
    return { deleted: true };
  }

  private toResponse(document: {
    id: string;
    ownerId: string;
    projectId: string | null;
    name: string;
    mimeType: string;
    sizeBytes: bigint;
    createdAt: Date;
    project: { id: string; title: string } | null;
  }) {
    return {
      id: document.id,
      ownerId: document.ownerId,
      projectId: document.projectId,
      name: document.name,
      mimeType: document.mimeType,
      sizeBytes: Number(document.sizeBytes),
      createdAt: document.createdAt,
      project: document.project,
      downloadUrl: `/api/documents/${document.id}/download`,
    };
  }
}
