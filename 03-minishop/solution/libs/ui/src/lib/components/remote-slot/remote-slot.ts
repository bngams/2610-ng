import { Component, Type, inject, input, resource } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { REMOTE_LOADER } from '../../models/remote-loader';

/**
 * Un emplacement pour un composant venu d'un remote, chargé à l'exécution.
 * S'il ne vient pas (remote arrêté), on affiche le contenu projeté, ou rien.
 */
@Component({
  imports: [NgComponentOutlet],
  selector: 'lib-remote-slot',
  styleUrl: './remote-slot.css',
  templateUrl: './remote-slot.html',
})
export class RemoteSlot {
  private readonly loadRemote = inject(REMOTE_LOADER);

  /** Le nom du remote, celui du manifeste : 'marketing'. */
  readonly remote = input.required<string>();
  /** La clé exposée par le remote : './PromoBanner'. */
  readonly exposed = input.required<string>();
  /** Le nom de la classe exportée par ce module : 'PromoBanner'. */
  readonly component = input.required<string>();

  /** Le chargement, vu comme un signal : value() (la classe du composant), error(), isLoading(). */
  protected readonly loaded = resource({
    params: () => ({ remote: this.remote(), exposed: this.exposed(), component: this.component() }),
    loader: async ({ params }) => {
      const module = await this.loadRemote(params.remote, params.exposed);
      const type = module[params.component];
      if (typeof type !== 'function') {
        throw new Error(`${params.remote} n'exporte pas ${params.component}`);
      }
      return type as Type<unknown>;
    },
  });
}
