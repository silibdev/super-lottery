import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MegaMenu } from 'primeng/megamenu';
import { MegaMenuItem } from 'primeng/api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MegaMenu],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly menuItems: MegaMenuItem[] = [];
}
