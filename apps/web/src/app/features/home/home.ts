import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Gate {
  readonly path: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly pitch: string;
  readonly cue: string;
  readonly media: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
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
      media: '/medias/split-dev.jpg',
      alt: 'Landing page de Case Tes Potes, développée en React',
      width: 1100,
      height: 434,
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
      media: '/medias/split-3d.jpg',
      alt: "Rendu 3D photoréaliste d'une maison moderne au crépuscule",
      width: 1280,
      height: 720,
      side: 'end',
      theme: 'dark',
    },
  ];
}
