import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { catchError, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

export const backendErrorFallbackInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (!shouldUseFrontendFallback(req, error)) {
        return throwError(() => error);
      }

      return of(new HttpResponse({
        status: 200,
        statusText: 'OK',
        url: req.urlWithParams,
        body: buildFallbackBody(req)
      }));
    })
  );
};

function shouldUseFrontendFallback(req: HttpRequest<unknown>, error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) {
    return false;
  }

  if (req.method !== 'GET' || req.responseType !== 'json') {
    return false;
  }

  if (!isNavoyageApiRequest(req.url)) {
    return false;
  }

  return error.status === 0 || error.status === 404 || error.status >= 500;
}

function isNavoyageApiRequest(url: string): boolean {
  const normalizedUrl = url.toLowerCase();
  const apiBaseUrl = environment.apiBaseUrl.toLowerCase();
  const backendApiBaseUrl = `${environment.backendBaseUrl}/api`.toLowerCase();

  return normalizedUrl.startsWith(apiBaseUrl) ||
    normalizedUrl.startsWith(backendApiBaseUrl) ||
    normalizedUrl.startsWith('/api/');
}

function buildFallbackBody(req: HttpRequest<unknown>): unknown {
  const lowerUrl = req.url.toLowerCase();

  if (lowerUrl.includes('getreviewsbybooking')) {
    return false;
  }

  const data = getFallbackData(lowerUrl);
  const message = 'No data available right now.';

  return {
    status: true,
    message,
    Message: message,
    data,
    isFrontendFallback: true
  };
}

function getFallbackData(lowerUrl: string): unknown {
  if (
    lowerUrl.includes('count') ||
    lowerUrl.includes('averagerating') ||
    lowerUrl.includes('/distance/calculate')
  ) {
    return 0;
  }

  if (
    lowerUrl.includes('getbyid') ||
    lowerUrl.includes('getuserbyid') ||
    lowerUrl.includes('getvehiclebyid') ||
    lowerUrl.includes('getroutebyid') ||
    lowerUrl.includes('getroutestoppointbyid') ||
    lowerUrl.includes('getseatlayoutbyvehicleid') ||
    lowerUrl.includes('getmyprofile') ||
    lowerUrl.includes('getmycompany') ||
    lowerUrl.includes('getbypnr')
  ) {
    return null;
  }

  return [];
}
