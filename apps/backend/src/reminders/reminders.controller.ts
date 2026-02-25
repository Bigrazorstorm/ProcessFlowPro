import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';

@ApiTags('Reminders')
@ApiBearerAuth('JWT-auth')
@Controller('reminders')
@UseGuards(JwtAuthGuard, TenantGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  /**
   * Manually trigger deadline reminders (admin / testing)
   */
  @Post('trigger/deadlines')
  @ApiOperation({ summary: 'Trigger deadline reminder emails manually' })
  async triggerDeadlineReminders() {
    return this.remindersService.triggerDeadlineReminders();
  }

  /**
   * Manually trigger escalation emails (admin / testing)
   */
  @Post('trigger/escalations')
  @ApiOperation({ summary: 'Trigger escalation emails manually' })
  async triggerEscalations() {
    return this.remindersService.triggerEscalations();
  }
}
