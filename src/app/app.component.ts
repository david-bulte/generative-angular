import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, Renderer2, } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { combineLatest, interval, Observable, Subject, timer, } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
    form: FormGroup;
    points$: Observable<any>;
    formVisible = false;
    formVisibleClicked = false;
    fullscreenClicked = false;
    private next$$ = new Subject();

    constructor(
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document: Document
    ) {
        this.form = new FormGroup({
            width: new FormControl(8, [Validators.required, Validators.min(1)]),
            size: new FormControl(100, [Validators.required, Validators.min(1)]),
            ratio: new FormControl(1, [Validators.required, Validators.min(1), Validators.max(7)]),
            fill: new FormControl(false),
            animate: new FormControl(false),
            strokeWidth: new FormControl(1, Validators.min(0.1)),
            dark: new FormControl(true),
            colored: new FormControl(true),
            rotate: new FormControl(true),
            type: new FormControl('rect'),
            bounce: new FormControl(false),
        });

        const animate$ = this.form.get('animate')!.valueChanges.pipe(
            startWith(this.form.get('animate')!.value),
            switchMap((animate) => (animate ? interval(100) : timer(0)))
        );

        const config$ = this.form.valueChanges.pipe(startWith(this.form.value));
        const next$ = this.next$$.pipe(startWith(null));

        this.points$ = combineLatest([config$, animate$, next$]).pipe(
            map(([config]) => {
                const cellsPerRow = Math.floor(Math.sqrt(config.size)) * config.ratio;
                const rows: any[][] = Array(cellsPerRow).fill(
                    Array(cellsPerRow).fill(null)
                );

                let strokeColor: string | null = null;

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

                return rows.flatMap((row, x) => {
                    return row.map((cell, y) => {
                        const stroke =
                            strokeColor ||
                            random(['red', 'blue', 'pink']);
                        return {
                            x: x * (config.size / cellsPerRow),
                            y: y * (config.size / cellsPerRow),
                            stroke,
                            strokeWidth: config.strokeWidth,
                            fill: config.fill ? stroke : 'transparent',
                            width: config.width,
                            height: config.width,
                            rotate: Math.floor(config.rotate ? Math.random() * 90 : 0),
                            bounce: config.bounce,
                            type:
                                config.type !== 'both'
                                    ? config.type
                                    : random(['rect', 'circle']),
                        };
                    });
                });
            })
        );

        let darkControl = this.form.get('dark');
        darkControl?.valueChanges
            .pipe(startWith(darkControl?.value))
            .subscribe((dark) =>
                this.renderer.setAttribute(
                    this.document.documentElement,
                    'data-theme',
                    dark ? 'dark' : 'light'
                )
            );
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
        alert('coming soon');
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
}

function random<T>(array: T[] = []) {
    return array[Math.floor(Math.random() * array.length)]
}
