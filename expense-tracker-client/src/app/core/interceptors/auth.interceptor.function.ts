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
    console.log('AuthInterceptor - Skipping auth for login/register request');
    return next(req);
  }
  
  const token = authService.getStoredToken();
  console.log('AuthInterceptor - URL:', req.url);
  console.log('AuthInterceptor - Token exists:', !!token);
  console.log('AuthInterceptor - Token value:', token);

  if (token) {
    // Clone the request with the token
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('AuthInterceptor - Request headers after token added:', 
      clonedReq.headers.has('Authorization') ? 
      clonedReq.headers.get('Authorization') : 
      'No Authorization header found');
    
    return next(clonedReq).pipe(
      catchError(error => {
        console.log('AuthInterceptor - Error:', error.status, error.message);
        if (error.status === 401) {
          // Handle 401 error - refresh token or redirect to login
          authService.logout();
          router.navigate(['/auth/login']);
        }
        return throwError(() => error);
      })
    );
  } else {
    console.log('AuthInterceptor - No token found, redirecting to login');
    router.navigate(['/auth/login']);
    return throwError(() => new Error('Authentication required'));
  }
};
