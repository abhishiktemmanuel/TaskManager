import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller() // This handles the root path
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get() // This handles GET /
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health') // This handles GET /health
  healthCheck() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Task Manager API',
    };
  }
}
