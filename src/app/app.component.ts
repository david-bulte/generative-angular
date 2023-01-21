import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as FileSaver from 'file-saver';
import { combineLatest, interval, Observable, Subject, timer } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-root-1',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  @ViewChild('svg') svgRef!: ElementRef<SVGElement>;
  @ViewChild('downloadHandle') downloadRef!: ElementRef<HTMLDivElement>;

  form: FormGroup;
  layers$: Observable<Layer[]>;
  formVisible = false;
  formVisibleClicked = false;
  fullscreenClicked = false;

  private next$$ = new Subject();

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.form = new FormGroup({
      width: new FormControl(64, [Validators.required, Validators.min(1)]),
      size: new FormControl(800, [Validators.required, Validators.min(1)]),
      ratio: new FormControl(1, [
        Validators.required,
        Validators.min(1),
        Validators.max(7),
      ]),
      scale: new FormControl(1, [Validators.min(0.1)]),
      fill: new FormControl(false),
      animate: new FormControl(false),
      strokeWidth: new FormControl(1, Validators.min(0.1)),
      dark: new FormControl(true),
      colored: new FormControl(true),
      rotate: new FormControl(true),
      type: new FormControl('rect'),
      bounce: new FormControl(false),
      showCenter: new FormControl(false),
    });

    const animate$ = this.form.get('animate')!.valueChanges.pipe(
      startWith(this.form.get('animate')!.value),
      switchMap((animate) => (animate ? interval(100) : timer(0)))
    );

    const config$ = this.form.valueChanges.pipe(startWith(this.form.value));
    const next$ = this.next$$.pipe(startWith(null));

    this.layers$ = combineLatest([config$, animate$, next$]).pipe(
      map(([config]) => {

        const layers: {[color in Color]: Layer} = {
          red: { name: 'red', points: [] },
          blue: { name: 'blue', points: [] },
          pink: { name: 'pink', points: [] },
          white: { name: 'white', points: [] },
          black: { name: 'black', points: [] },
        };

        const cellsPerRow = Math.floor(Math.sqrt(config.size)) * config.ratio;
        const rows: any[][] = Array(cellsPerRow).fill(
          Array(cellsPerRow).fill(null)
        );

        let strokeColor: Color | null = null;

        if (config.colored) {
          let sameColor = Math.floor(Math.random() * 5) === 0;
          if (sameColor) {
            if (config.animate) {
              strokeColor = random([
                'red',
                'blue',
                'pink',
                config.dark ? 'white' : 'black',
              ]);
            } else {
              strokeColor = random(['red', 'blue', 'pink']);
            }
          }
        } else {
          strokeColor = config.dark ? 'white' : 'black';
        }

        const points: Point[] = rows.flatMap((row, x) => {
          return row.map((cell, y) => {
            const stroke: Color = strokeColor || random(['red', 'blue', 'pink']);
            const rotate = Math.floor(config.rotate ? Math.random() * 90 : 0);
            const scale = config.scale || 1;
            const coorX = x * (config.size / cellsPerRow);
            const coorY = y * (config.size / cellsPerRow);

            const transform = `rotate(${rotate}) scale(${config.scale})`;

            // inkscape transform
            const inkscapeWidth = config.width * config.scale;
            const centerX = coorX + inkscapeWidth / 2; // * config.scale)
            const centerY = coorY + inkscapeWidth / 2; // * config.scale)
            const transformOrigin = `${centerX} ${centerY}`;
            const inkscapeTransform = [
              config.rotate
                ? `rotate(${rotate}, ${centerX}, ${centerY})`
                : null,
              // config.scale ? `scale(${config.scale})` : null,
            ]
              .filter((transformation) => !!transformation)
              .join(' ');

            return {
              x: coorX,
              y: coorY,
              r: config.width / 2,
              centerX,
              centerY,
              stroke,
              strokeWidth: config.strokeWidth,
              fill: config.fill ? stroke : 'transparent',
              width: config.width,
              height: config.width,
              transform,
              transformOrigin,
              inkscapeTransform: inkscapeTransform,
              inkscapeWidth,
              bounce: config.bounce,
              showCenter: config.showCenter,
              type:
                config.type !== 'both'
                  ? config.type
                  : random(['rect', 'circle']),
            };
          });
        });

        points.forEach(point => {
          layers[point.stroke].points.push(point);
        })

        return Object.values(layers);
      })
    );

    const darkControl = this.form.get('dark');
    darkControl?.valueChanges
      .pipe(startWith(darkControl?.value))
      .subscribe((dark) => {
        this.renderer.setAttribute(
          this.document.documentElement,
          'data-theme',
          dark ? 'dark' : 'light'
        );
      });
  }

  get fullscreenEnabled() {
    return this.document.fullscreenEnabled;
  }

  get animating() {
    return this.form.get('animate')?.value === true;
  }

  next() {
    this.next$$.next();
  }

  download() {
    // let svg: string | null = this.svgRef.nativeElement.innerHTML;
    const clone = this.svgRef.nativeElement.cloneNode(true);
    this.inkscapify(clone);
    // this.stripG(clone);
    this.downloadRef.nativeElement.firstChild?.remove();
    this.renderer.appendChild(this.downloadRef.nativeElement, clone);

    const svg = this.downloadRef.nativeElement.innerHTML;

    const uint8Array = new Uint8Array(new ArrayBuffer(svg.length));
    for (let i = 0, strLen = svg.length; i < strLen; i++) {
      uint8Array[i] = svg.charCodeAt(i);
    }
    const blob = new Blob([uint8Array], { type: 'text/csv;charset=utf-8' });
    FileSaver.saveAs(blob, 'generative-angular.svg');
  }

  toggleFormVisible() {
    this.formVisible = !this.formVisible;
    this.formVisibleClicked = true;
  }

  toggleFullscreen(page: HTMLDivElement) {
    if (this.document.fullscreenElement) {
      this.document.exitFullscreen();
    } else {
      page.requestFullscreen();
    }

    this.fullscreenClicked = true;
  }

  private inkscapify(svg: Node, parent: Node | null = null) {
    if (svg.nodeName === '#comment') {
      (<Element>svg).remove();
    } else {
      (<Element>svg).getAttributeNames().forEach((attributeName) => {
        if (attributeName.startsWith('_ngcontent')) {
          (<Element>svg).removeAttribute(attributeName);
        }
      });
      (<Element>svg).removeAttribute('transform');
      (<Element>svg).removeAttribute('width');
      (<Element>svg).removeAttribute('height');

      const transform = (<Element>svg).getAttribute(
        'data-inkscape-transform'
      ) as string;
      (<Element>svg).removeAttribute('data-inkscape-transform');
      (<Element>svg).setAttribute('transform', transform);

      const width = (<Element>svg).getAttribute(
        'data-inkscape-width'
      ) as string;
      (<Element>svg).removeAttribute('data-inkscape-width');
      (<Element>svg).setAttribute('width', width);
      (<Element>svg).setAttribute('height', width);

      svg.childNodes.forEach((node) => {
        this.inkscapify(node, svg);
      });
    }
  }

  private stripG(svg: Node, parent: Node | null = null) {
    if (svg.nodeName === 'g' && parent) {
      (<Element>svg).remove();
      svg.childNodes.forEach((childNode) => {
        parent?.appendChild(childNode);
      });
      svg = parent;
    }

    svg.childNodes?.forEach((node) => {
      this.stripG(node, svg);
    });
  }
}

function random<T>(array: T[] = []) {
  return array[Math.floor(Math.random() * array.length)];
}

type Color = 'red' | 'blue' | 'pink' | 'black' | 'white'

interface Layer {
  name: Color;
  points: Point[];
}

interface Point {
  x: number;
  y: number;
  r?: number;
  centerX: number;
  centerY: number;
  stroke: Color;
  strokeWidth: number;
  fill: Color | 'transparent',
  width: number;
  height: number;
  transform: string;
  transformOrigin: string;
  inkscapeTransform: string;
  inkscapeWidth: number;
  bounce: boolean;
  showCenter: boolean;
  type: string;
}
