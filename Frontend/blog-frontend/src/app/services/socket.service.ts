import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

export interface SocketCommentEvent {
  comment: any;
  articleId: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: any | null = null;
  private readonly SERVER_URL = 'http://localhost:4000';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async connect(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.socket) {
      const { io } = await import('socket.io-client');
      this.socket = io(this.SERVER_URL);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinArticle(articleId: string): void {
    if (this.socket) {
      this.socket.emit('join-article', articleId);
    }
  }

  leaveArticle(articleId: string): void {
    if (this.socket) {
      this.socket.emit('leave-article', articleId);
    }
  }

  onNewComment(): Observable<SocketCommentEvent> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('new-comment', (data: SocketCommentEvent) => {
          observer.next(data);
        });
      }
    });
  }

  onCommentUpdated(): Observable<SocketCommentEvent> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('comment-updated', (data: SocketCommentEvent) => {
          observer.next(data);
        });
      }
    });
  }

  onCommentDeleted(): Observable<{ commentId: string; articleId: string; timestamp: string }> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('comment-deleted', (data: { commentId: string; articleId: string; timestamp: string }) => {
          observer.next(data);
        });
      }
    });
  }

  onConnect(): Observable<string> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('connect', () => {
          observer.next(this.socket!.id);
        });
      }
    });
  }

  onDisconnect(): Observable<void> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('disconnect', () => {
          observer.next();
        });
      }
    });
  }
}


