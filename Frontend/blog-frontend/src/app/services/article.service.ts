import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Article {
  _id: string;
  title: string;
  content: string;
  excerpt?: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tags: string[];
  imageUrl?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  readingTime?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleListResponse {
  articles: Article[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalArticles: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  imageUrl?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdateArticleRequest extends Partial<CreateArticleRequest> {}

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private readonly API_URL = 'http://localhost:4000/api/articles';
  private readonly UPLOAD_URL = 'http://localhost:4000/api/upload/image';

  constructor(private http: HttpClient) {}

  getArticles(params?: {
    page?: number;
    limit?: number;
    status?: string;
    author?: string;
    tags?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Observable<ArticleListResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] !== undefined) {
          httpParams = httpParams.set(key, params[key as keyof typeof params]!.toString());
        }
      });
    }

    return this.http.get<ArticleListResponse>(this.API_URL, { params: httpParams });
  }

  getArticle(id: string): Observable<{ article: Article }> {
    return this.http.get<{ article: Article }>(`${this.API_URL}/${id}`);
  }

  createArticle(article: CreateArticleRequest): Observable<{ message: string; article: Article }> {
    return this.http.post<{ message: string; article: Article }>(this.API_URL, article);
  }

  updateArticle(id: string, article: UpdateArticleRequest): Observable<{ message: string; article: Article }> {
    return this.http.put<{ message: string; article: Article }>(`${this.API_URL}/${id}`, article);
  }

  deleteArticle(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`);
  }

  getMyArticles(params?: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Observable<ArticleListResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] !== undefined) {
          httpParams = httpParams.set(key, params[key as keyof typeof params]!.toString());
        }
      });
    }

    return this.http.get<ArticleListResponse>(`${this.API_URL}/my/articles`, { params: httpParams });
  }

  likeArticle(id: string, action: 'like' | 'unlike'): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/${id}/like`, { action });
  }

  uploadImage(file: File): Observable<{ imageUrl: string }> {
    const form = new FormData();
    form.append('image', file);
    return this.http.post<{ imageUrl: string }>(this.UPLOAD_URL, form);
  }
}


