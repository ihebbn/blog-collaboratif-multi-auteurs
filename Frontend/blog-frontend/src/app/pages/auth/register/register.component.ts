import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  loading = false;
  error: string | null = null;
  form!: FormGroup;

  get passwordsMismatch(): boolean {
    const p = this.form.get('password')?.value;
    const c = this.form.get('confirm')?.value;
    return !!p && !!c && p !== c;
  }

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  ngOnInit(): void {
    this.form = this.buildForm();
  }

  private buildForm() {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.passwordsMismatch) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.error = null;
    const { firstName, lastName, email, password } = this.form.value as any;
    this.auth.register({ firstName, lastName, email, password }).subscribe({
      next: () => { this.loading = false; window.location.href = '/'; },
      error: err => { this.loading = false; this.error = err?.error?.message ?? 'Registration failed'; }
    });
  }
}


