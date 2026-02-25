import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { AiSuggestionsService } from './ai-suggestions.service';

@ApiTags('AI Suggestions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('ai-suggestions')
export class AiSuggestionsController {
  constructor(private readonly aiSuggestionsService: AiSuggestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get AI-powered insights and suggestions for the current tenant' })
  @ApiResponse({ status: 200, description: 'AI insights generated successfully' })
  getInsights(@Request() req: any) {
    return this.aiSuggestionsService.getInsights(req.user.tenantId!);
  }
}
