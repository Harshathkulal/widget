import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SetupService } from './setup.service';
import { RegisterAppDto } from './dto/register-app.dto';

@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Post('register-app')
  @HttpCode(HttpStatus.CREATED)
  async registerApp(@Body() registerAppDto: RegisterAppDto) {
    return this.setupService.registerApp(registerAppDto);
  }
}
