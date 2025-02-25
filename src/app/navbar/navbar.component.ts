import { Component, HostListener } from '@angular/core';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  animations: [
    trigger('menuAnimation', [
      state(
        'open',
        style({
          transform: 'translateY(0)',
          opacity: 1,
        })
      ),
      state(
        'closed',
        style({
          transform: 'translateY(-100%)',
          opacity: 0,
        })
      ),
      transition('closed => open', [animate('0.3s ease-out')]),
      transition('open => closed', [animate('0.2s ease-in')]),
    ]),
  ],
})
export class NavbarComponent {
  isMenuActive = false;
  isMobile = window.innerWidth <= 768;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile = window.innerWidth <= 768;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.isMobile) return;

    const navLinks = document.querySelector('.nav-links');
    const menuBtn = document.querySelector('.mobile-menu-btn');

    if (
      this.isMenuActive &&
      navLinks &&
      menuBtn &&
      !navLinks.contains(event.target as Node) &&
      !menuBtn.contains(event.target as Node)
    ) {
      this.isMenuActive = false;
    }
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuActive = !this.isMenuActive;
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    if (this.isMobile) {
      this.isMenuActive = false;
    }
  }
}
