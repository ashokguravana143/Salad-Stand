import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { LocationService } from '../services/location.service';

export const orderingGuard: CanActivateFn = async () => {
  const location = inject(LocationService);
  const router = inject(Router);
  await location.ensureInitialized();
  if (!location.orderingBlocked()) {
    return true;
  }
  return router.createUrlTree(['/']);
};
