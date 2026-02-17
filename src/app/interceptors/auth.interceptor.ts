import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // ❌ Do NOT attach token for login/register
  const isAuthEndpoint =
    req.url.includes('/api/auth/login') ||
    req.url.includes('/api/auth/register');

  if (isAuthEndpoint) {
    return next(req);
  }

  const raw = localStorage.getItem('masirat_auth');

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const token = parsed.token;

      if (token) {
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  return next(req);
};
