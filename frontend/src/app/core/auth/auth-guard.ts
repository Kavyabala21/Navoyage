import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
export const authGuard: CanActivateFn = (route, state) => {

  const isLoggedIn = !!sessionStorage.getItem('token');

  if (isLoggedIn) {
    return true;
  }

  return inject(Router).createUrlTree(['/login']);
};
