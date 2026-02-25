import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        return `${timestamp} [${context || 'Application'}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
      }),
    ),
  }),
];

if (process.env.LOGSTASH_HOST) {
  // Dynamic import to avoid errors when package is not installed
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const LogstashTransport = require('winston-logstash/lib/winston-logstash-latest');
    transports.push(
      new LogstashTransport({
        port: parseInt(process.env.LOGSTASH_PORT || '5000', 10),
        node_name: 'processflowpro-backend',
        host: process.env.LOGSTASH_HOST,
      }),
    );
  } catch {
    // logstash transport not available
  }
}

export const winstonConfig = {
  transports,
};

@Module({
  imports: [WinstonModule.forRoot(winstonConfig)],
  exports: [WinstonModule],
})
export class LoggerModule {}
