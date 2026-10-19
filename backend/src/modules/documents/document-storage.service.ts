import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const MIME_EXTENSIONS: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

function isNodeError(error: unknown, code: string): error is NodeJS.ErrnoException {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code === code
  );
}

@Injectable()
export class DocumentStorageService {
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = resolve(config.getOrThrow<string>("DOCUMENT_STORAGE_DIR"));
  }

  isAllowedMimeType(mimeType: string): boolean {
    return mimeType in MIME_EXTENSIONS;
  }

  async save(buffer: Buffer, mimeType: string): Promise<string> {
    const extension = MIME_EXTENSIONS[mimeType];
    if (!extension) {
      throw new BadRequestException("Unsupported document type");
    }

    await mkdir(this.root, { recursive: true });
    const storageKey = `${randomUUID()}${extension}`;
    await writeFile(this.filePath(storageKey), buffer, {
      flag: "wx",
      mode: 0o600,
    });
    return storageKey;
  }

  async getFilePath(storageKey: string): Promise<string> {
    const filePath = this.filePath(storageKey);
    try {
      await stat(filePath);
      return filePath;
    } catch (error) {
      if (isNodeError(error, "ENOENT")) {
        throw new NotFoundException("Document file not found");
      }
      throw error;
    }
  }

  async remove(storageKey: string): Promise<void> {
    try {
      await unlink(this.filePath(storageKey));
    } catch (error) {
      if (!isNodeError(error, "ENOENT")) {
        throw error;
      }
    }
  }

  private filePath(storageKey: string): string {
    const extension = extname(storageKey);
    const id = storageKey.slice(0, -extension.length);
    if (
      !/^[0-9a-f-]{36}$/i.test(id) ||
      !Object.values(MIME_EXTENSIONS).includes(extension)
    ) {
      throw new NotFoundException("Document file not found");
    }

    const filePath = resolve(this.root, storageKey);
    if (!filePath.startsWith(`${this.root}${sep}`)) {
      throw new NotFoundException("Document file not found");
    }
    return filePath;
  }
}
