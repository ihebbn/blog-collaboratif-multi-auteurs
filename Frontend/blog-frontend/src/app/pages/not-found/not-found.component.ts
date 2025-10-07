import { Component } from '@angular/core';

@Component({
  selector: 'app-not-found',
  standalone: true,
  template: `
    <section style="padding:16px">
      <h1>404 - Not Found</h1>
      <p>The page you are looking for does not exist.</p>
    </section>
  `
})
export class NotFoundComponent {}


