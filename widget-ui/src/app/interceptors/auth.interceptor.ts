import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { WidgetAuthService } from '../services/widget-auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(WidgetAuthService);
  const token = authService.getToken();

  if (token && req.url.startsWith(authService.getApiBaseUrl())) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req);
};
