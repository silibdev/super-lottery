import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MegaMenu } from 'primeng/megamenu';
import { MegaMenuItem } from 'primeng/api';
import { Button, ButtonDirective, ButtonLabel } from 'primeng/button';
import { AppMessages } from './app-messages/app-messages';
import { Dialog } from 'primeng/dialog';
import { FloatLabel } from 'primeng/floatlabel';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { httpResource } from '@angular/common/http';
import { AppResponse } from './models';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MegaMenu,
    RouterLink,
    AppMessages,
    ButtonLabel,
    ButtonDirective,
    Button,
    Dialog,
    FloatLabel,
    FormsModule,
    InputText,
    ReactiveFormsModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly menuItems: MegaMenuItem[] = [
    { label: 'Owned Lotteries', routerLink: ['/lotteries/manage'] },
    { label: 'Joined Lotteries', routerLink: ['/lotteries/joined'] },
  ];

  protected name = httpResource<AppResponse<string>>(() => '/api/name');
  protected changeNameDialogVisible = signal(false);
  protected nameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected changeNameLoading = signal(false);

  protected async changeName() {
    this.changeNameLoading.set(true);
    const name = this.nameControl.value;
    await fetch('/api/name', { method: 'PUT', body: JSON.stringify({ name }) });
    this.changeNameDialogVisible.set(false);
    this.changeNameLoading.set(false);
    this.name.reload();
  }
}
