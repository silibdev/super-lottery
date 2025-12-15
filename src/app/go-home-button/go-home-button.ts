import { Component } from '@angular/core';
import { ButtonDirective, ButtonIcon, ButtonLabel } from 'primeng/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-go-home-button',
  imports: [ButtonLabel, ButtonDirective, RouterLink, ButtonIcon],
  templateUrl: './go-home-button.html',
  styleUrl: './go-home-button.scss',
})
export class GoHomeButton {}
