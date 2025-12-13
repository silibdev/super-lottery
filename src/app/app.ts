import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MegaMenu } from 'primeng/megamenu';
import { MegaMenuItem } from 'primeng/api';
import { Button } from 'primeng/button';
import { AppMessages } from './app-messages/app-messages';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MegaMenu, Button, RouterLink, AppMessages],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly menuItems: MegaMenuItem[] = [
    { label: 'Owned Lotteries', routerLink: ['/lotteries/manage'] },
    { label: 'Joined Lotteries', routerLink: ['/lotteries/joined'] },
  ];
}
