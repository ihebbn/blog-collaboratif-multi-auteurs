import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, map } from 'rxjs';
import { ArticleService, Article } from '../../../services/article.service';

@Component({
  selector: 'app-my-articles',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-articles.component.html',
  styleUrls: ['./my-articles.component.css', './my-articles.component.scss']
})
export class MyArticlesComponent implements OnInit {
  articles$!: Observable<Article[]>;
  loading = true;

  constructor(private articleService: ArticleService) {}

  ngOnInit(): void {
    this.articles$ = this.articleService.getMyArticles({ page: 1, limit: 10 }).pipe(map(r => r.articles));
    this.articles$.subscribe({ next: () => { this.loading = false; }, error: () => { this.loading = false; } });
  }
}


