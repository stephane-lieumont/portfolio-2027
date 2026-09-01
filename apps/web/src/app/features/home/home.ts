import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface Swatch {
  readonly token: string;
  readonly note: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly submitting = signal(false);

  protected readonly surfaces: readonly Swatch[] = [
    { token: '--surface-page', note: 'Fond de page' },
    { token: '--surface-raised', note: 'Cartes' },
    { token: '--surface-sunken', note: 'Zones en creux' },
    { token: '--accent-wash', note: 'Puces, survol tertiaire' },
    { token: '--accent-solid', note: 'Bouton primaire' },
    { token: '--accent', note: 'Marque, aplats à encre sombre' },
  ];

  protected readonly scale: readonly string[] = [
    't-display',
    't-h1',
    't-h2',
    't-h3',
    't-body',
    't-overline',
  ];

  protected toggleSubmitting(): void {
    this.submitting.update((value) => !value);
  }
}
