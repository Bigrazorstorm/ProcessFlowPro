import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { SignaturesService } from './signatures.service';
import { CreateSignatureRequestDto, SignDocumentDto, RejectSignatureDto } from './dto/signature.dto';

@ApiTags('Signatures')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('signatures')
export class SignaturesController {
  constructor(private readonly signaturesService: SignaturesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new signature request' })
  @ApiResponse({ status: 201, description: 'Signature request created successfully' })
  create(@Request() req: any, @Body() dto: CreateSignatureRequestDto) {
    this.signaturesService.registerUserName(req.user.tenantId!, req.user.id, req.user.name || req.user.email);
    return this.signaturesService.create(req.user.tenantId!, req.user.id, req.user.name || req.user.email, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all signature requests for the current tenant' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  findAll(@Request() req: any, @Query('status') status?: string) {
    return this.signaturesService.findAll(req.user.tenantId!, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific signature request' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.signaturesService.findOne(req.user.tenantId!, id);
  }

  @Post(':id/sign')
  @ApiOperation({ summary: 'Sign a document (current user adds their signature)' })
  @ApiResponse({ status: 200, description: 'Document signed successfully' })
  sign(@Request() req: any, @Param('id') id: string, @Body() dto: SignDocumentDto) {
    return this.signaturesService.sign(
      req.user.tenantId!,
      id,
      req.user.id,
      req.user.name || req.user.email,
      dto.comment,
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a signature request' })
  @ApiResponse({ status: 200, description: 'Signature request rejected' })
  reject(@Request() req: any, @Param('id') id: string, @Body() dto: RejectSignatureDto) {
    return this.signaturesService.reject(
      req.user.tenantId!,
      id,
      req.user.id,
      req.user.name || req.user.email,
      dto.comment,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a signature request' })
  cancel(@Request() req: any, @Param('id') id: string) {
    this.signaturesService.cancel(req.user.tenantId!, id, req.user.id, req.user.name || req.user.email);
  }
}
