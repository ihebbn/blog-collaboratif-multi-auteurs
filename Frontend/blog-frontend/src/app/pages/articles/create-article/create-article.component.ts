import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ArticleService, CreateArticleRequest } from '../../../services/article.service';

@Component({
  selector: 'app-create-article',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-article.component.html',
  styleUrls: ['./create-article.component.css', './create-article.component.scss']
})
export class CreateArticleComponent implements OnInit {
  private fb = inject(FormBuilder);
  private articleService = inject(ArticleService);
  private router = inject(Router);

  form!: FormGroup;
  submitting = false;
  selectedFile?: File;

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(5)]],
      excerpt: [''],
      tags: [''],
      status: ['draft', Validators.required]
    });
  }

  submit(): void {
    if (this.form.invalid || this.submitting) return;
    this.submitting = true;

    const value = this.form.value;
    const req: CreateArticleRequest = {
      title: value.title,
      content: value.content,
      excerpt: value.excerpt || undefined,
      status: value.status,
      tags: (value.tags as string)
        ? (value.tags as string).split(',').map(t => t.trim()).filter(Boolean)
        : undefined
    };
    const performCreate = (imageUrl?: string) => {
      const payload: CreateArticleRequest = { ...req, imageUrl };
      this.articleService.createArticle(payload).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/articles']);
        },
        error: () => {
          this.submitting = false;
        }
      });
    };

    if (this.selectedFile) {
      this.articleService.uploadImage(this.selectedFile).subscribe({
        next: (r) => performCreate(r.imageUrl),
        error: () => performCreate(undefined)
      });
      return;
    }

    performCreate();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
    }
  }
}


