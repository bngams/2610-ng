import { Injectable } from '@angular/core';
import { Application } from '../application';
import { ResourceService } from './resource.service';

/** Les dossiers de candidature : le CRUD suffit, un dossier part avec `create(dossier)`. */
@Injectable({ providedIn: 'root' })
export class ApplicationsService extends ResourceService<number, Application> {
  protected readonly path = 'applications';
}
