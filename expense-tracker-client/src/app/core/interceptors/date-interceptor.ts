import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class DateInterceptor implements HttpInterceptor {
  private isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?(?:Z|[-+]\d{2}:\d{2})?$/;

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Convert outgoing dates to ISO strings
    if (request.body) {
      request = request.clone({
        body: this.convertDatesToISOString(request.body)
      });
    }

    // Process the response to convert ISO strings to Date objects
    return next.handle(request).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          const body = event.body;
          if (body) {
            const convertedBody = this.convertISOStringsToDates(body);
            return event.clone({ body: convertedBody });
          }
        }
        return event;
      })
    );
  }

  private convertDatesToISOString(body: any): any {
    if (body === null || body === undefined || typeof body !== 'object') {
      return body;
    }

    if (body instanceof Date) {
      return body.toISOString();
    }

    if (Array.isArray(body)) {
      return body.map(item => this.convertDatesToISOString(item));
    }

    const result = { ...body };
    for (const key of Object.keys(body)) {
      const value = body[key];
      if (value instanceof Date) {
        result[key] = value.toISOString();
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.convertDatesToISOString(value);
      }
    }

    return result;
  }

  private convertISOStringsToDates(body: any): any {
    if (body === null || body === undefined || typeof body !== 'object') {
      return body;
    }

    if (Array.isArray(body)) {
      return body.map(item => this.convertISOStringsToDates(item));
    }

    const result = { ...body };
    for (const key of Object.keys(body)) {
      const value = body[key];
      if (typeof value === 'string' && this.isoDatePattern.test(value)) {
        result[key] = new Date(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.convertISOStringsToDates(value);
      }
    }

    return result;
  }
}
