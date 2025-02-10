import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-booking-form',
  templateUrl: './booking-form.component.html',
  styleUrls: ['./booking-form.component.css'],
})
export class BookingFormComponent {
  bookingForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.bookingForm = this.fb.group({
      location: ['', Validators.required],
      time: ['', Validators.required],
      date: ['', Validators.required],
      serviceRequired: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.bookingForm.valid) {
      localStorage.setItem(
        'bookingDetails',
        JSON.stringify(this.bookingForm.value)
      );
      this.router.navigate(['confirmation']);
    }
  }
}
