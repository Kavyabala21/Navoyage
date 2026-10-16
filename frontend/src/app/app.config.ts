import 'zone.js';
import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { DataFacade } from '../Shared/Services/data-fascade';
import { authInitializerFactory } from './auth.initializer';
import { backendErrorFallbackInterceptor } from './core/http/backend-error-fallback.interceptor';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([backendErrorFallbackInterceptor])),
    provideAnimations(),
    provideToastr({
      positionClass: 'toast-bottom-center',
      timeOut: 3000,
      progressBar: true,
      closeButton: true,
      newestOnTop: true,
      preventDuplicates: true,
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: authInitializerFactory,
      deps: [DataFacade],
      multi: true
    }
  ]
};


