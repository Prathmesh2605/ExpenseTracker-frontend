import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';

import { routes } from './app.routes';
import { CoreModule } from './core/core.module';
import { authInterceptor } from './core/interceptors/auth.interceptor.function';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(CoreModule)
  ]
};

// Create a global injector to access services
import { Injector } from '@angular/core';

declare global {
  interface Window {
    injector: Injector | null;
  }
}
