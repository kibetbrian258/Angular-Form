import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CombinedStepperComponent } from './combined-stepper/combined-stepper.component';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { HomepageComponent } from './homepage/homepage.component';
import { LoginComponent } from './login/login.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { TermsComponent } from './terms/terms.component';

const routes: Routes = [
  { path: 'booking', component: CombinedStepperComponent },
  { path: 'confirmation', component: ConfirmationComponent },
  { path: 'homepage', component: HomepageComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },

  { path: '', redirectTo: 'homepage', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
