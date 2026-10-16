import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const noAuthGuard: CanActivateFn = () => {

  const router = inject(Router);
  const token = sessionStorage.getItem('token');

  if (token) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
