import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { HomepageComponent } from './homepage/homepage.component';
import { LoginComponent } from './login/login.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { TermsComponent } from './terms/terms.component';
import { UserBookingsComponent } from './user-bookings/user-bookings.component';
import { RegistrationComponent } from './registration/registration.component';
import { BookingComponent } from './booking/booking.component';
import { AuthGuard } from './Guards/auth.guard';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ServiceManagementComponent } from './service-management/service-management.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { BookingManagementComponent } from './booking-management/booking-management.component';
import { AdminGuard } from './Guards/admin-guard.guard';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { LocationManagementComponent } from './location-management/location-management.component';
import { ServiceAvailabilityManagementComponent } from './service-availability-management/service-availability-management.component';

const routes: Routes = [
  // Regular user routes
  { path: 'registration', component: RegistrationComponent },
  {
    path: 'confirmation',
    component: ConfirmationComponent,
    canActivate: [AuthGuard],
  },
  { path: 'booking', component: BookingComponent, canActivate: [AuthGuard] },
  { path: 'homepage', component: HomepageComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  {
    path: 'user-bookings',
    component: UserBookingsComponent,
    canActivate: [AuthGuard],
  },

  // Admin specific routes - only using AdminGuard
  { path: 'admin-login', component: AdminLoginComponent },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [AdminGuard], // Use only AdminGuard here
    children: [
      { path: 'services', component: ServiceManagementComponent },
      { path: 'locations', component: LocationManagementComponent },
      { path: 'bookings', component: BookingManagementComponent },
      { path: 'users', component: UserManagementComponent },
      {
        path: 'service-availability',
        component: ServiceAvailabilityManagementComponent,
      },
      {
        path: '',
        redirectTo: 'bookings',
        pathMatch: 'full',
      },
    ],
  },

  { path: '', redirectTo: 'homepage', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
