import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, map } from 'rxjs';
import { ArticleService, Article } from '../../../services/article.service';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './article-list.component.html',
  styleUrls: ['./article-list.component.css', './article-list.component.scss']
})
export class ArticleListComponent implements OnInit {
  articles$!: Observable<Article[]>;
  loading = true;

  constructor(private articleService: ArticleService) {}

  ngOnInit(): void {
    this.articles$ = this.articleService.getArticles({ page: 1, limit: 10, status: 'published' })
      .pipe(
        map(res => res.articles)
      );

    // Toggle loading off when first value arrives
    this.articles$.subscribe({ next: () => { this.loading = false; }, error: () => { this.loading = false; } });
  }

  resolveImageUrl(imageUrl?: string | null): string | null {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    const normalized = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `http://localhost:4000${normalized}`;
  }
}


