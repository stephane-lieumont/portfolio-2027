import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Gate {
  readonly path: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly pitch: string;
  readonly cue: string;
  readonly side: 'start' | 'end';
  readonly theme: 'light' | 'dark';
}

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  // Two halves of one split, not two cards. Each carries the theme its section
  // will use, so the visitor sees where they are going before they go — and
  // neither is illustrated, so neither outweighs the other.
  protected readonly gates: readonly Gate[] = [
    {
      path: '/developpeur',
      eyebrow: 'Développement',
      title: 'Ce que je construis',
      pitch:
        'Angular, TypeScript, .NET. Des applications menées de la décision technique à la mise en production.',
      cue: 'Voir les réalisations',
      side: 'start',
      theme: 'light',
    },
    {
      path: '/graphisme-3d',
      eyebrow: 'Graphisme 3D',
      title: 'Ce que j’explore',
      pitch:
        'Modélisation, texturing, rendu. Une pratique apprise seule, qui nourrit mon regard de développeur.',
      cue: 'Voir la galerie',
      side: 'end',
      theme: 'dark',
    },
  ];
}
