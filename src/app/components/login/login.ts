import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ButtonComponent } from '../../shared/button/button';

type LoginForm = {
  email: FormControl<string>;
  password: FormControl<string>;
};

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  loading = false;
  error: string | null = null;
  showLoginPassword = false;

toggleLoginPassword() {
  this.showLoginPassword = !this.showLoginPassword;
}


  form!: FormGroup<LoginForm>;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    // ✅ Create form AFTER fb is available
    this.form = this.fb.nonNullable.group({
      email: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.email,
      ]),
      password: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.minLength(6),
      ]),
    });
    this.form.valueChanges.subscribe(() => {
      this.error = null;
    });
    
  }

  submit() {
    this.error = null;
  
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
  
    this.loading = true;
  
    const { email, password } = this.form.getRawValue();
  
    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/generator']);
      },
      error: (err) => {
        this.loading = false;
  
        if (err.status === 401) {
          // ✅ Show message immediately (not tied to touched)
          this.error = 'Invalid email or password';
  
          // ✅ Optional: visually mark fields as invalid
          this.form.controls.email.setErrors({ invalidLogin: true });
          this.form.controls.password.setErrors({ invalidLogin: true });
        } else {
          this.error = 'Server error. Please try again.';
        }
      },
    });
  }  

}
