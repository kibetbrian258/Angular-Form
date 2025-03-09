import { Component, OnInit } from '@angular/core';
import { AdminAuthService } from '../Service/admin-auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent {
  constructor(
    public adminAuthService: AdminAuthService,
    private router: Router
  ) {}

  logout(): void {
    this.adminAuthService.logout();
    this.router.navigate(['/admin-login']);
  }
}
