import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { createReadStream } from "node:fs";
import { Response } from "express";
import { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DocumentsService } from "./documents.service";

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

@Controller("documents")
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.listMine(user.sub);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_DOCUMENT_SIZE },
    }),
  )
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body("projectId") projectId?: string,
  ) {
    return this.documentsService.create(user.sub, file, projectId);
  }

  @Get(":id/download")
  async download(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.documentsService.getForDownload(
      id,
      user.sub,
      user.role,
    );
    response.setHeader("Content-Type", file.mimeType);
    response.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    );
    return new StreamableFile(createReadStream(file.filePath));
  }

  @Delete(":id")
  delete(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.delete(id, user.sub, user.role);
  }
}
