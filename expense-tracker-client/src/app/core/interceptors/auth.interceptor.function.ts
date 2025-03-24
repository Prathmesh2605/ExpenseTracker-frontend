import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip interceptor for login/register requests
  if (req.url.includes('/api/Auth/login') || req.url.includes('/api/Auth/register')) {
    return next(req);
  }
  
  const token = authService.getStoredToken();

  if (token) {
    // Clone the request with the token
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
        
    return next(clonedReq).pipe(
      catchError(error => {
        if (error.status === 401) {
          // Handle 401 error - refresh token or redirect to login
          authService.logout();
          router.navigate(['/auth/login']);
        }
        return throwError(() => error);
      })
    );
  } else {
    router.navigate(['/auth/login']);
    return throwError(() => new Error('Authentication required'));
  }
};
