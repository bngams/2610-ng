import { HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { finalize, tap } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const started = Date.now();
  let status = 0;
  return next(req).pipe(
    tap({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          status = event.status;
        }
      },
      error: (error) => {
        status = error.status;
      },
    }),
    finalize(() => {
      const elapsed = Date.now() - started;
      console.log(`${req.method} ${req.urlWithParams} => ${status} (${elapsed} ms)`);
    }),
  );
};
