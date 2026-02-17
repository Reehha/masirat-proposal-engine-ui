import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header'; // 🔁 adjust path if needed
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, CommonModule],
  templateUrl: './app.html',
})
export class AppComponent {
  showHeader = true;

  constructor(private router: Router) {
    // ✅ Set initial value
    this.updateHeaderVisibility(this.router.url);

    // ✅ Update on every navigation
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        const nav = e as NavigationEnd;
        this.updateHeaderVisibility(nav.urlAfterRedirects || nav.url);
      });
  }

  private updateHeaderVisibility(url: string) {
    // Remove query params & hash
    const cleanUrl = url.split('?')[0].split('#')[0];

    // ❌ Hide ONLY on these exact routes
    if (cleanUrl === '/login' || cleanUrl === '/register') {
      this.showHeader = false;
    } else {
      this.showHeader = true;
    }

    // 🔎 Debug (remove later)
    console.log('Route:', cleanUrl, 'showHeader:', this.showHeader);
  }
}
