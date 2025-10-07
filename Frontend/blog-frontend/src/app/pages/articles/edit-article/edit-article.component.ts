import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService, UpdateArticleRequest, Article } from '../../../services/article.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-edit-article',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-article.component.html',
  styleUrls: ['./edit-article.component.css', './edit-article.component.scss']
})
export class EditArticleComponent implements OnInit {
  private fb = inject(FormBuilder);
  private articleService = inject(ArticleService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  form!: FormGroup;
  submitting = false;
  articleId!: string;

  async ngOnInit(): Promise<void> {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(5)]],
      excerpt: [''],
      tags: [''],
      status: ['draft', Validators.required]
    });

    this.articleId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.articleId) return;

    const res = await firstValueFrom(this.articleService.getArticle(this.articleId));
    const article: Article = res.article;
    this.form.patchValue({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      tags: (article.tags || []).join(', '),
      status: article.status
    });
  }

  submit(): void {
    if (this.form.invalid || this.submitting) return;
    this.submitting = true;

    const v = this.form.value;
    const req: UpdateArticleRequest = {
      title: v.title,
      content: v.content,
      excerpt: v.excerpt || undefined,
      status: v.status,
      tags: (v.tags as string)
        ? (v.tags as string).split(',').map(t => t.trim()).filter(Boolean)
        : undefined
    };

    this.articleService.updateArticle(this.articleId, req).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/articles', this.articleId]);
      },
      error: () => {
        this.submitting = false;
      }
    });
  }
}


