import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class HeaderComponent implements OnInit {
  menuOpen = false;

  userEmail: string = 'user@example.com';
  avatarLetter: string = 'U';

  constructor(private router: Router) {}

  ngOnInit() {
    const raw = localStorage.getItem('masirat_auth');
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data?.email) {
          this.userEmail = data.email;
          this.avatarLetter = data.email.charAt(0).toUpperCase();
        }
      } catch (e) {
        console.error('Invalid masirat_auth in localStorage', e);
      }
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  goToSettings() {
    this.menuOpen = false;
    this.router.navigate(['/settings']);
  }

  goToManage() {
    this.menuOpen = false;
    this.router.navigate(['/manage']);
  }

  logout() {
    this.menuOpen = false;
    localStorage.removeItem('masirat_auth'); // clear session
    this.router.navigate(['/login']);
  }
}
