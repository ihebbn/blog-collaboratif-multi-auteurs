import { Component, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ArticleService, Article } from '../../../services/article.service';
import { Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommentService } from '../../../services/comment.service';
import { SocketService } from '../../../services/socket.service';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.css', './article-detail.component.scss']
})
export class ArticleDetailComponent implements OnInit, OnDestroy {
  article$!: Observable<Article>;
  comments: any[] = [];
  form!: FormGroup;
  private articleId!: string;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private articleService: ArticleService,
    private commentsService: CommentService,
    private socket: SocketService,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.article$ = this.route.paramMap.pipe(
      switchMap(params => {
        this.articleId = params.get('id') || '';
        return this.articleService.getArticle(this.articleId);
      }),
      // unwrap { article }
      switchMap(res => new Observable<Article>(observer => { observer.next(res.article); observer.complete(); }))
    );

    this.form = this.fb.group({ content: ['', [Validators.required, Validators.minLength(1)]] });

    if (isPlatformBrowser(this.platformId)) {
      // load comments (browser only to avoid SSR 403 due to missing auth)
      this.loadComments();

      // sockets
      this.socket.connect();
      this.socket.joinArticle(this.articleId);
      this.socket.onNewComment()
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.loadComments());
      this.socket.onCommentUpdated()
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.loadComments());
      this.socket.onCommentDeleted()
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.loadComments());
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.socket.leaveArticle(this.articleId);
      this.socket.disconnect();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadComments(): void {
    if (!this.articleId) return;
    this.commentsService.getArticleComments(this.articleId).subscribe({
      next: (res) => this.comments = res.comments || [],
    });
  }

  addComment(): void {
    if (this.form.invalid) return;
    const content = this.form.value.content;
    this.commentsService.createComment(this.articleId, { content }).subscribe({
      next: (res) => {
        this.form.reset();
        this.comments.unshift(res.comment);
        // Real-time updates are handled by backend broadcast; refresh list locally
      }
    });
  }
}


