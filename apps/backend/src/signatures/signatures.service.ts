import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  SignatureRequest,
  SignatureStatus,
  SignerRecord,
  SignerStatus,
  RevisionEntry,
  CreateSignatureRequestDto,
} from './dto/signature.dto';

@Injectable()
export class SignaturesService {
  private readonly logger = new Logger(SignaturesService.name);

  /** In-memory store: tenantId → signature requests */
  private requests: Map<string, SignatureRequest[]> = new Map();

  /** In-memory user name cache: tenantId → Map<userId, userName> */
  private userNames: Map<string, Map<string, string>> = new Map();

  registerUserName(tenantId: string, userId: string, userName: string): void {
    if (!this.userNames.has(tenantId)) {
      this.userNames.set(tenantId, new Map());
    }
    this.userNames.get(tenantId)!.set(userId, userName);
  }

  private getUserName(tenantId: string, userId: string): string {
    return this.userNames.get(tenantId)?.get(userId) ?? userId;
  }

  create(
    tenantId: string,
    requestedBy: string,
    requestedByName: string,
    dto: CreateSignatureRequestDto,
  ): SignatureRequest {
    const now = new Date();
    const signers: SignerRecord[] = dto.signerIds.map((uid) => ({
      userId: uid,
      userName: this.getUserName(tenantId, uid),
      status: SignerStatus.PENDING,
    }));

    const request: SignatureRequest = {
      id: uuidv4(),
      tenantId,
      title: dto.title,
      description: dto.description,
      documentId: dto.documentId,
      documentName: dto.documentName,
      status: dto.signerIds.length > 0 ? SignatureStatus.PENDING : SignatureStatus.DRAFT,
      signers,
      requiredSignatureCount: signers.length,
      signedCount: 0,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      requestedBy,
      requestedByName,
      revisionHistory: [
        {
          action: 'created',
          performedBy: requestedBy,
          performedByName: requestedByName,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    if (!this.requests.has(tenantId)) {
      this.requests.set(tenantId, []);
    }
    this.requests.get(tenantId)!.push(request);

    this.logger.log(`Created signature request "${request.title}" for tenant ${tenantId}`);
    return request;
  }

  findAll(tenantId: string, status?: string): SignatureRequest[] {
    const list = this.requests.get(tenantId) || [];
    if (status) {
      return list.filter((r) => r.status === status);
    }
    return list;
  }

  findOne(tenantId: string, id: string): SignatureRequest {
    const request = (this.requests.get(tenantId) || []).find((r) => r.id === id);
    if (!request) {
      throw new NotFoundException(`Signature request ${id} not found`);
    }
    return request;
  }

  sign(tenantId: string, id: string, userId: string, userName: string, comment?: string): SignatureRequest {
    const request = this.findOne(tenantId, id);

    if (request.status === SignatureStatus.COMPLETED || request.status === SignatureStatus.CANCELLED) {
      throw new ForbiddenException(`Cannot sign a ${request.status} request`);
    }

    const signer = request.signers.find((s) => s.userId === userId);
    if (!signer) {
      throw new ForbiddenException('You are not a signer for this request');
    }
    if (signer.status === SignerStatus.SIGNED) {
      throw new ForbiddenException('You have already signed this document');
    }

    const now = new Date();
    signer.status = SignerStatus.SIGNED;
    signer.signedAt = now;
    signer.comment = comment;

    request.signedCount = request.signers.filter((s) => s.status === SignerStatus.SIGNED).length;
    request.status =
      request.signedCount >= request.requiredSignatureCount
        ? SignatureStatus.COMPLETED
        : SignatureStatus.PARTIALLY_SIGNED;

    const revision: RevisionEntry = {
      action: 'signed',
      performedBy: userId,
      performedByName: userName,
      timestamp: now,
      comment,
    };
    request.revisionHistory.push(revision);
    request.updatedAt = now;

    this.logger.log(`User ${userName} signed request "${request.title}" in tenant ${tenantId}`);
    return request;
  }

  reject(tenantId: string, id: string, userId: string, userName: string, comment?: string): SignatureRequest {
    const request = this.findOne(tenantId, id);

    if (request.status === SignatureStatus.COMPLETED || request.status === SignatureStatus.CANCELLED) {
      throw new ForbiddenException(`Cannot reject a ${request.status} request`);
    }

    const signer = request.signers.find((s) => s.userId === userId);
    if (!signer) {
      throw new ForbiddenException('You are not a signer for this request');
    }

    const now = new Date();
    signer.status = SignerStatus.REJECTED;
    signer.signedAt = now;
    signer.comment = comment;

    request.status = SignatureStatus.REJECTED;

    const revision: RevisionEntry = {
      action: 'rejected',
      performedBy: userId,
      performedByName: userName,
      timestamp: now,
      comment,
    };
    request.revisionHistory.push(revision);
    request.updatedAt = now;

    this.logger.log(`User ${userName} rejected request "${request.title}" in tenant ${tenantId}`);
    return request;
  }

  cancel(tenantId: string, id: string, userId: string, userName: string): SignatureRequest {
    const request = this.findOne(tenantId, id);

    if (request.requestedBy !== userId) {
      throw new ForbiddenException('Only the request creator can cancel it');
    }
    if (request.status === SignatureStatus.COMPLETED) {
      throw new ForbiddenException('Cannot cancel a completed request');
    }

    const now = new Date();
    request.status = SignatureStatus.CANCELLED;
    request.revisionHistory.push({
      action: 'cancelled',
      performedBy: userId,
      performedByName: userName,
      timestamp: now,
    });
    request.updatedAt = now;

    this.logger.log(`User ${userName} cancelled request "${request.title}" in tenant ${tenantId}`);
    return request;
  }
}
