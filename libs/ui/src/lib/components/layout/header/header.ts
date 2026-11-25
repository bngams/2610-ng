import { Component, computed, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MenuItem } from '../../../models/menu-item';

@Component({
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
  selector: 'lib-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  /** Le titre affiché à gauche, lien vers l'accueil. */
  readonly title = input.required<string>();
  /** Les liens du menu ; chaque application fournit les siens. */
  readonly menuItems = input<MenuItem[]>([]);

  /** Les liens à afficher : ceux qui n'ont pas de règle `visible`, ou dont la règle renvoie true. */
  protected readonly visibleItems = computed(() =>
    this.menuItems().filter((item) => item.visible?.() ?? true),
  );
}
