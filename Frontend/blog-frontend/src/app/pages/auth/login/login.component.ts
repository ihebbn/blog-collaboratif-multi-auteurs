import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loading = false;
  error: string | null = null;
  form!: FormGroup;

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  ngOnInit(): void {
    this.form = this.buildForm();
  }

  private buildForm() {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.error = null;
    this.auth.login(this.form.value as any).subscribe({
      next: () => { this.loading = false; window.location.href = '/'; },
      error: err => { this.loading = false; this.error = err?.error?.message ?? 'Login failed'; }
    });
  }
}


