import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateDocumentDto, UpdateDocumentDto, DocumentRecord } from './dto/document.dto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  /** In-memory store: tenantId → documents */
  private documents: Map<string, DocumentRecord[]> = new Map();

  create(tenantId: string, userId: string, uploadedByName: string, dto: CreateDocumentDto): DocumentRecord {
    const now = new Date();
    const doc: DocumentRecord = {
      id: uuidv4(),
      tenantId,
      name: dto.name,
      description: dto.description,
      fileType: dto.fileType,
      url: dto.url,
      linkedEntityType: dto.linkedEntityType,
      linkedEntityId: dto.linkedEntityId,
      linkedEntityName: dto.linkedEntityName,
      uploadedBy: userId,
      uploadedByName,
      createdAt: now,
      updatedAt: now,
    };

    if (!this.documents.has(tenantId)) {
      this.documents.set(tenantId, []);
    }
    this.documents.get(tenantId)!.push(doc);

    this.logger.log(`Created document "${doc.name}" for tenant ${tenantId}`);
    return doc;
  }

  findAll(tenantId: string, linkedEntityType?: string, linkedEntityId?: string): DocumentRecord[] {
    const docs = this.documents.get(tenantId) || [];
    return docs.filter((d) => {
      if (linkedEntityType && d.linkedEntityType !== linkedEntityType) return false;
      if (linkedEntityId && d.linkedEntityId !== linkedEntityId) return false;
      return true;
    });
  }

  findOne(tenantId: string, id: string): DocumentRecord {
    const doc = (this.documents.get(tenantId) || []).find((d) => d.id === id);
    if (!doc) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    return doc;
  }

  update(tenantId: string, id: string, dto: UpdateDocumentDto): DocumentRecord {
    const doc = this.findOne(tenantId, id);

    if (dto.name !== undefined) doc.name = dto.name;
    if (dto.description !== undefined) doc.description = dto.description;
    if (dto.fileType !== undefined) doc.fileType = dto.fileType;
    if (dto.url !== undefined) doc.url = dto.url;
    if (dto.linkedEntityType !== undefined) doc.linkedEntityType = dto.linkedEntityType;
    if (dto.linkedEntityId !== undefined) doc.linkedEntityId = dto.linkedEntityId;
    if (dto.linkedEntityName !== undefined) doc.linkedEntityName = dto.linkedEntityName;
    doc.updatedAt = new Date();

    return doc;
  }

  remove(tenantId: string, id: string): void {
    const docs = this.documents.get(tenantId) || [];
    const index = docs.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    docs.splice(index, 1);
  }
}
