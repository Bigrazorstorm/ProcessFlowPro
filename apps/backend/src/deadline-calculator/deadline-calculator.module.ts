import { Module } from '@nestjs/common';
import { DeadlineCalculatorService } from './deadline-calculator.service';

@Module({
  providers: [DeadlineCalculatorService],
  exports: [DeadlineCalculatorService],
})
export class DeadlineCalculatorModule {}
