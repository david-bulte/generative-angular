import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: '[rect]',
  templateUrl: './rect.component.html',
  styleUrls: ['./rect.component.css']
})
export class RectComponent implements OnInit {

  @Input() rect: any;

  constructor() { }

  ngOnInit(): void {
  }

}
