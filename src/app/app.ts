import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MegaMenu } from 'primeng/megamenu';
import { MegaMenuItem } from 'primeng/api';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MegaMenu, Button, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly menuItems: MegaMenuItem[] = [
    {label: 'Manage Lottery', routerLink: ['/lotteries/manage']},
  ];
}
