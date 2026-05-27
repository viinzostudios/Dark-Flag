import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const landingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.hasActiveSession()) {
    return router.createUrlTree(['/lobby']);
  }

  // Sin sesión activa — limpiar tokens residuales (ej. access sin refresh)
  auth.clearSession();
  return true;
};
