import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-proposal-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proposal-preview.html',
  styleUrls: ['./proposal-preview.css'],
})
export class ProposalPreviewComponent {
  @Input() data: any;

  get timeline() {
    return this.data?.timeline;
  }

  get objectives() {
    return this.data?.requirements?.objectives || [];
  }

  get clientRequirements() {
    return this.data?.requirements?.clientRequirements || [];
  }

  get packages() {
    return this.data?.pricing?.packages || [];
  }
}
