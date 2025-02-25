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
import { CombinedStepperComponent } from './combined-stepper/combined-stepper.component';
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
import { HttpClientModule } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomSnackbarComponent } from './custom-snackbar/custom-snackbar.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  declarations: [
    AppComponent,
    ConfirmationComponent,
    CombinedStepperComponent,
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
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
