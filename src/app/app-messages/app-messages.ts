import { Component, inject } from '@angular/core';
import { Message } from 'primeng/message';
import { AppMessagesService } from './app-messages.service';
import { AppMessage } from '../models';

@Component({
  selector: 'app-app-messages',
  imports: [Message],
  templateUrl: './app-messages.html',
  styleUrl: './app-messages.scss',
})
export class AppMessages {
  private appMessagesService = inject(AppMessagesService);

  protected messages = this.appMessagesService.getMessages();

  closeMessage(message: AppMessage) {
    this.appMessagesService.closeMessage(message);
  }
}
