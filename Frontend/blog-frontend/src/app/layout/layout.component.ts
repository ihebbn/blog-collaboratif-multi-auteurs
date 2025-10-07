import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css', './layout.component.scss']
})
export class LayoutComponent {
  private readonly auth = inject(AuthService);
  isLoggedIn = false;
  isAdmin = false;

  constructor() {
    this.isLoggedIn = this.auth.isAuthenticated();
    this.auth.currentUser$.subscribe(u => {
      this.isLoggedIn = !!u;
      this.isAdmin = (u?.role === 'Admin');
    });
  }

  logout(): void {
    this.auth.logout();
    window.location.href = '/';
  }
}


