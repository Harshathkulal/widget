import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';

import { UsersService } from './users.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersDto } from './dto/get-users.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() createUserDto: CreateUserDto, @Req() req: any) {
    const tenantId = req.user.tenantId;
    const applicationId = req.user.applicationId;
    const performedBy = `admin:${req.user.email}`;
    return this.usersService.create(
      tenantId,
      applicationId,
      createUserDto,
      performedBy,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  findAll(@Query() query: GetUsersDto, @Req() req: any) {
    const tenantId = req.user.tenantId;
    const applicationId = req.user.applicationId;
    return this.usersService.findAll(tenantId, applicationId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user.tenantId;
    const applicationId = req.user.applicationId;
    return this.usersService.findOne(tenantId, applicationId, id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const applicationId = req.user.applicationId;
    const performedBy = `admin:${req.user.email}`;
    return this.usersService.update(
      tenantId,
      applicationId,
      id,
      updateUserDto,
      performedBy,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user.tenantId;
    const applicationId = req.user.applicationId;
    const performedBy = `admin:${req.user.email}`;
    return this.usersService.remove(tenantId, applicationId, id, performedBy);
  }
}
