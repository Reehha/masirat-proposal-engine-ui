import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormGroup,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../shared/button/button';
import { AuthService } from '../../services/auth';


@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {
  loading = false;
  error: string | null = null;
  showPassword = false;
showConfirmPassword = false;

togglePassword() {
  this.showPassword = !this.showPassword;
}

toggleConfirmPassword() {
  this.showConfirmPassword = !this.showConfirmPassword;
}


  countries: string[] = [
    'Oman', 'India', 'Pakistan', 'Philippines', 'Bangladesh', 'Sri Lanka',
    'Nepal', 'Egypt', 'Jordan', 'United Arab Emirates', 'United Kingdom', 'United States'
  ];

  form: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private auth: AuthService ) {
    // ✅ Build form here (no TS2729)
    this.form = this.fb.nonNullable.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        dob: ['', [Validators.required, this.minAgeValidator(18)]],
        gender: ['', Validators.required],
        phone: ['', [Validators.required, Validators.pattern(/^\+968\s[79]\d{7}$/)]],
        nationality: ['', Validators.required],
        address: ['', [Validators.required, Validators.minLength(10)]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).+$/),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
    
  }
  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (!pass || !confirm) return null;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  get passwordMismatch(): boolean {
    return this.form.hasError('passwordMismatch') && this.c('confirmPassword').touched;
  }
  

  // ✅ Safe accessor for template
  c(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
  
    this.loading = true;
    this.error = null;
  
    const raw = this.form.getRawValue();
  
    const payload = {
      firstName: raw.firstName,
      lastName: raw.lastName,
      dob: raw.dob, // must be YYYY-MM-DD (input type="date" already does this)
      email: raw.email,
      gender: raw.gender,
      phoneNumber: raw.phone,   // map to backend field
      nationality: raw.nationality,
      address: raw.address,
      password: raw.password,
      role: 'USER', // or 'ADMIN' if you want
    };
  
    this.auth.register(payload).subscribe({
      next: () => {
        this.loading = false;
        // Already logged in (token stored), go to app
        this.router.navigate(['/generator']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 400) {
          this.error = 'Validation failed. Please check your inputs.';
        } else if (err.status === 409 || err.status === 400) {
          this.error = 'Email already registered.';
        } else {
          this.error = 'Server error. Please try again later.';
        }
      },
    });
  }  

  // ✅ Age validator
  minAgeValidator(minAge: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const dob = new Date(control.value);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      return age >= minAge ? null : { minAge: true };
    };
  }

  // ✅ Oman phone auto-format
  onPhoneInput() {
    let digits = this.c('phone').value.replace(/\D/g, '');
    if (!digits.startsWith('968')) digits = '968' + digits;
    digits = digits.slice(0, 11);

    let formatted = '+' + digits.substring(0, 3);
    if (digits.length > 3) formatted += ' ' + digits.substring(3);

    this.c('phone').setValue(formatted, { emitEvent: false });
  }
}
