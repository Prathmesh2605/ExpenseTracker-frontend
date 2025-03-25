import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip interceptor for login/register requests
    if (request.url.includes('/api/Auth/login') || request.url.includes('/api/Auth/register')) {
      return next.handle(request);
    }
    
    const token = this.authService.getStoredToken();

    if (token) {
      // Clone the request so we can examine its headers after modifications
      request = this.addToken(request, token);
    } else {
      this.router.navigate(['/auth/login']);
      return throwError(() => new Error('Authentication required'));
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        return this.authService.refreshToken(refreshToken).pipe(
          switchMap(() => {
            this.isRefreshing = false;
            const newToken = this.authService.getStoredToken();
            return next.handle(this.addToken(request, newToken!));
          }),
          catchError((error) => {
            this.isRefreshing = false;
            this.authService.logout();
            this.router.navigate(['/auth/login']);
            return throwError(() => error);
          })
        );
      }
    }

    this.authService.logout();
    this.router.navigate(['/auth/login']);
    return throwError(() => new Error('Session expired'));
  }
}
