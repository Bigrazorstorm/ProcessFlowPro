import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/document.dto';

@ApiTags('Documents')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload / register a new document' })
  @ApiResponse({ status: 201, description: 'Document created successfully' })
  create(@Request() req: any, @Body() dto: CreateDocumentDto) {
    return this.documentsService.create(
      req.user.tenantId!,
      req.user.id,
      req.user.name || req.user.email,
      dto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all documents for the current tenant' })
  @ApiQuery({ name: 'linkedEntityType', required: false, description: 'Filter by entity type (client|workflow)' })
  @ApiQuery({ name: 'linkedEntityId', required: false, description: 'Filter by linked entity ID' })
  findAll(
    @Request() req: any,
    @Query('linkedEntityType') linkedEntityType?: string,
    @Query('linkedEntityId') linkedEntityId?: string,
  ) {
    return this.documentsService.findAll(req.user.tenantId!, linkedEntityType, linkedEntityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific document' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.documentsService.findOne(req.user.tenantId!, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document metadata' })
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(req.user.tenantId!, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document' })
  remove(@Request() req: any, @Param('id') id: string) {
    this.documentsService.remove(req.user.tenantId!, id);
  }
}
