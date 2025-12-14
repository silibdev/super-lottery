import { Component } from '@angular/core';
import { version } from '../../../package.json';


@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected version = version;
}
