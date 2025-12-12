import { Injectable, signal } from '@angular/core';
import { AppMessage } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AppMessagesService {
  private messages = signal<AppMessage[]>([]);

  showMessage(message: AppMessage) {
    this.messages.update((messages) => [...messages, message]);
  }

  closeMessage(message: AppMessage) {
    this.messages.update((messages) =>
      messages.filter((m) => m.description !== message.description),
    );
  }

  getMessages() {
    return this.messages;
  }

  showHttpError() {
    return (error: any) => {
      this.showMessage({ type: 'error', description: error.message || 'Unknown error' });
      throw error;
    };
  }
}
