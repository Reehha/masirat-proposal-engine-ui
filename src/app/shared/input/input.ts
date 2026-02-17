// input.component.ts
import { Component, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './input.html',
  styleUrl: './input.html',
})
export class InputComponent {
  @Input() label = '';
  @Input() type: string = 'text';
  @Input() control: any;
}
