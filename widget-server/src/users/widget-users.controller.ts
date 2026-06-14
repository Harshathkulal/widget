/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateBulkStatusDto } from './dto/update-bulk-status.dto';
import { RemoveBulkUsersDto } from './dto/remove-bulk-users.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { WidgetAuthGuard } from '../auth/guards/widget-auth.guard';

@Controller('widget/users')
@UseGuards(WidgetAuthGuard)
export class WidgetUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const { tenantId, applicationId } = req.user;
    const performedBy = `widget_session:${req.user.sessionId}`;

    return this.usersService.create(
      tenantId,
      applicationId,
      createUserDto,
      performedBy,
      ip,
    );
  }

  @Get()
  async findAll(@Query() query: GetUsersDto, @Req() req: any) {
    const { tenantId, applicationId } = req.user;

    return this.usersService.findAll(tenantId, applicationId, query);
  }

  /**
   * IMPORTANT:
   * Static routes MUST come before :id routes
   */

  @Delete('bulk')
  async removeBulk(
    @Body() dto: RemoveBulkUsersDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const { tenantId, applicationId } = req.user;
    const performedBy = `widget_session:${req.user.sessionId}`;

    return this.usersService.removeBulk(
      tenantId,
      applicationId,
      dto.ids,
      performedBy,
      ip,
    );
  }

  @Patch('bulk-status')
  async updateStatusBulk(
    @Body() dto: UpdateBulkStatusDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const { tenantId, applicationId } = req.user;
    const performedBy = `widget_session:${req.user.sessionId}`;

    return this.usersService.updateStatusBulk(
      tenantId,
      applicationId,
      dto.ids,
      dto.status,
      performedBy,
      ip,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const { tenantId, applicationId } = req.user;

    return this.usersService.findOne(tenantId, applicationId, id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const { tenantId, applicationId } = req.user;
    const performedBy = `widget_session:${req.user.sessionId}`;

    return this.usersService.update(
      tenantId,
      applicationId,
      id,
      updateUserDto,
      performedBy,
      ip,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any, @Ip() ip: string) {
    const { tenantId, applicationId } = req.user;
    const performedBy = `widget_session:${req.user.sessionId}`;

    return this.usersService.remove(
      tenantId,
      applicationId,
      id,
      performedBy,
      ip,
    );
  }
}
