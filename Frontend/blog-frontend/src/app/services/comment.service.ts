import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  article: string;
  parentComment?: string;
  replies: Comment[];
  isApproved: boolean;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentListResponse {
  comments: Comment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalComments: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private readonly API_URL = 'http://localhost:4000/api/comments';

  constructor(private http: HttpClient) {}

  getArticleComments(articleId: string, params?: {
    page?: number;
    limit?: number;
  }): Observable<CommentListResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] !== undefined) {
          httpParams = httpParams.set(key, params[key as keyof typeof params]!.toString());
        }
      });
    }

    return this.http.get<CommentListResponse>(`${this.API_URL}/article/${articleId}`, { params: httpParams });
  }

  createComment(articleId: string, comment: CreateCommentRequest): Observable<{ message: string; comment: Comment }> {
    return this.http.post<{ message: string; comment: Comment }>(`${this.API_URL}/article/${articleId}`, comment);
  }

  updateComment(commentId: string, comment: UpdateCommentRequest): Observable<{ message: string; comment: Comment }> {
    return this.http.put<{ message: string; comment: Comment }>(`${this.API_URL}/${commentId}`, comment);
  }

  deleteComment(commentId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${commentId}`);
  }

  likeComment(commentId: string, action: 'like' | 'unlike'): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/${commentId}/like`, { action });
  }

  getMyComments(params?: {
    page?: number;
    limit?: number;
  }): Observable<CommentListResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] !== undefined) {
          httpParams = httpParams.set(key, params[key as keyof typeof params]!.toString());
        }
      });
    }

    return this.http.get<CommentListResponse>(`${this.API_URL}/my/comments`, { params: httpParams });
  }
}


