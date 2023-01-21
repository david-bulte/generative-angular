import { Component, HostBinding, Input, OnInit } from '@angular/core';

@Component({
  selector: '[circle]',
  templateUrl: './circle.component.html',
  styleUrls: ['./circle.component.css']
})
export class CircleComponent implements OnInit {

  @Input() circle: any;
  @Input() point: any;

  @HostBinding('attr.x') get x() {
    return this.point?.x;
  }

  @HostBinding('attr.y') get y() {
    return this.point?.y;
  }

  @HostBinding('attr.width') get width() {
    return this.point?.width;
  }

  constructor() { }

  ngOnInit(): void {
  }

}
