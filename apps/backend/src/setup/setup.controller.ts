import { Controller, Post, Get } from '@nestjs/common';
import { SetupService } from './setup.service';

@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('status')
  async getStatus() {
    return this.setupService.getSetupStatus();
  }

  @Post('initialize')
  async initialize() {
    return this.setupService.initializeSystem();
  }
}
