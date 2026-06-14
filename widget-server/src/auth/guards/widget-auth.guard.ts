import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class WidgetAuthGuard extends AuthGuard('widget-jwt') {}
