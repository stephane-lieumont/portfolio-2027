import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <main class="home">
      <h1>Portfolio 2027</h1>
      <p>Squelette en place. Le design et le contenu arrivent après la phase de specs.</p>
    </main>
  `,
  styles: `
    .home {
      display: grid;
      place-content: center;
      gap: 1rem;
      min-height: 100dvh;
      padding: 2rem;
      text-align: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
