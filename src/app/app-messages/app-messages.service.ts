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

  showHttpError(options?: { dontThrow?: boolean }) {
    return async (error: unknown) => {
      if (error instanceof Response) {
        const body = await error.json();
        this.showMessage({ type: 'error', description: body.data || 'No description provided' });
      } else {
        this.showMessage({ type: 'error', description: 'Unknown error' });
      }
      if (!options?.dontThrow) {
        throw error;
      }
    };
  }
}
