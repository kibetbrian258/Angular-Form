import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { RouterModule } from '@angular/router';
import { HomepageComponent } from './homepage/homepage.component';
import { NavbarComponent } from './navbar/navbar.component';
import { AboutComponent } from './about/about.component';
import { ServicesComponent } from './services/services.component';
import { CarouselComponent } from './carousel/carousel.component';
import { FooterComponent } from './footer/footer.component';
import { TermsComponent } from './terms/terms.component';
import { MatIconModule } from '@angular/material/icon';
import { LoginComponent } from './login/login.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomSnackbarComponent } from './custom-snackbar/custom-snackbar.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { UserBookingsComponent } from './user-bookings/user-bookings.component';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { RegistrationComponent } from './registration/registration.component';
import { BookingComponent } from './booking/booking.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { ServiceManagementComponent } from './service-management/service-management.component';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { UserManagementComponent } from './user-management/user-management.component';
import { BookingManagementComponent } from './booking-management/booking-management.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { JwtInterceptor } from './interceptors/jwt.interceptor';
import { AdminInterceptor } from './interceptors/Admin.interceptor';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { LocationManagementComponent } from './location-management/location-management.component';
import { ServiceAvailabilityManagementComponent } from './service-availability-management/service-availability-management.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';
import { MatSortModule } from '@angular/material/sort';

@NgModule({
  declarations: [
    AppComponent,
    ConfirmationComponent,
    HomepageComponent,
    NavbarComponent,
    AboutComponent,
    ServicesComponent,
    CarouselComponent,
    FooterComponent,
    TermsComponent,
    LoginComponent,
    PrivacyPolicyComponent,
    CustomSnackbarComponent,
    ConfirmDialogComponent,
    UserBookingsComponent,
    RegistrationComponent,
    BookingComponent,
    AdminDashboardComponent,
    ServiceManagementComponent,
    UserManagementComponent,
    BookingManagementComponent,
    AdminLoginComponent,
    LocationManagementComponent,
    ServiceAvailabilityManagementComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    RouterModule,
    MatIconModule,
    HttpClientModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatCardModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
    MatTableModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatProgressBarModule,
    CommonModule,
    MatSortModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AdminInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
