import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import * as FileSaver from 'file-saver';
import { evaluate } from 'mathjs';
import { Observable, of, throwError } from 'rxjs';
import {
    catchError,
    filter,
    map,
    pairwise,
    startWith,
    tap,
} from 'rxjs/operators';

// @ts-ignore
import domtoimage from 'dom-to-image-more';


const X = 0;
const Y = 0;
const R = 30;

@Component({
    selector: 'app-root',
    templateUrl: './rosetta.component.html',
    styleUrls: ['./rosetta.component.css'],
})
export class RosettaComponent implements OnInit {

    @ViewChild('svg', {static: true}) svg!: ElementRef<SVGElement>;
    @ViewChild('downloadHandle') downloadRef!: ElementRef<HTMLDivElement>;

    circle$: Observable<{ cx: number; cy: number; r: number }>;
    bands$: Observable<{ x1: number; x2: number; y1: number; y2: number; nbr: number }[][]>;
    lines$: Observable<{ x1: number; x2: number; y1: number; y2: number; nbr: number }[]>;
    // coordinates$: Observable<string>;
    triangles$: Observable<any[]>;

    form = new FormGroup({
        bands: new FormArray([
            new FormGroup({
                radius: new FormControl(R),
                parts: new FormControl(10),
                expr: new FormControl('1, 3, 5, 3, 1'),
            }),
            new FormGroup({
                radius: new FormControl(R + 30),
                parts: new FormControl(20),
                expr: new FormControl('1, 3, 5, 3, 1'),
            }),
            new FormGroup({
                radius: new FormControl(R + 30 + 30),
                parts: new FormControl(40),
                expr: new FormControl('1, 3, 5, 3'),
            }),
        ]),
    });

    // }, {updateOn: 'submit'});

    get bands() {
        return this.form.get('bands') as FormArray;
    }

    constructor(private renderer: Renderer2) {
        // // 360 / 6 = 60
        // // 60 = 3x + 2x + 1x
        // // x = 10
        // // const split: number[] = [1, 5, 1];
        // const parts = 20;
        // // const split: number[] = [3, 2, 1];
        // // const split: number[] = [1, 4, 1];
        // const split: number[] = [1, 3, 5, 3, 1];
        //
        // const partSize = 360 / parts;
        // const expr = split.map((el) => el + 'x').join('+'); // eg. '3x+2x+1x'
        // console.log('expr', expr);
        // let x: number = solve(expr, partSize);
        //
        // // @ts-ignore
        // console.log('x', x);
        // // const x = 10;
        // const split2 = split.reduce((prev: number[], curr) => {
        //     return [...prev, (prev.length > 0 ? prev[prev.length - 1] : 0) + curr];
        // }, [] as Array<number>);

        // this.lines$ =  of(
        //     Array(parts)
        //         .fill(0)
        //         .map((x, i) => i * (360 / parts))
        //         .flatMap((nbr) => {
        //             return split2
        //                 .map((s) => nbr + s * x)
        //                 .map((nbr2) => ({
        //                     x1: X,
        //                     y1: Y,
        //                     x2: R * Math.cos((nbr2 * Math.PI) / 180),     // * pi / 180 => radians
        //                     y2: R * Math.sin((nbr2 * Math.PI) / 180),
        //                     nbr: nbr2,
        //                 }));
        //             // return [nbr, nbr + 1 * 15, nbr + 5 * 15, nbr + 6 * 15].map(nbr2 => ({x1: X, y1: Y, x2: R * Math.cos(nbr2 *  Math.PI/180), y2: R * Math.sin(nbr2 *  Math.PI/180), nbr: nbr2}));
        //             // return {x1: X, y1: Y, x2: R * Math.cos(nbr *  Math.PI/180), y2: R * Math.sin(nbr *  Math.PI/180), nbr}
        //         })
        //         .map((coordinate) => {
        //             return {
        //                 x1: X + coordinate.x1,
        //                 y1: Y + coordinate.y1,
        //                 x2: X + coordinate.x2,
        //                 y2: Y + coordinate.y2,
        //                 nbr: coordinate.nbr,
        //             };
        //         })
        // );

        this.circle$ = this.form.valueChanges.pipe(
            startWith(this.form.value),
            map((value: { radius: number }) => {
                return {cx: X, cy: Y, r: value.radius};
            })
        );

        // const gap = 0.2;
        // const gap = 0.1;
        const gap = 1;
        this.bands$ = this.form.valueChanges.pipe(
            startWith(this.form.value),
            map(
                (value: {
                    bands: { parts: number; expr: string; radius: number }[];
                }) => {
                    return value.bands.map((band, index) => {
                        const parts = band.parts;
                        const _expr = band.expr;
                        const radius = band.radius;

                        const split: number[] = _expr
                            .split(',')
                            .map((el) => +el.trim())
                            .filter((el) => !!el);
                        const partSize = 360 / parts;
                        const expr = split.map((el) => el + 'x').join('+'); // eg. '3x+2x+1x'
                        let x: number = solve(expr, partSize);
                        const split2 = split.reduce((prev: number[], curr) => {
                            return [
                                ...prev,
                                (prev.length > 0 ? prev[prev.length - 1] : 0) + curr,
                            ];
                        }, [] as Array<number>);

                        return Array(parts)
                            .fill(0)
                            .map((x, i) => i * (360 / parts))
                            .flatMap((nbr) => {
                                return split2
                                    .map((s) => nbr + s * x)
                                    .map((nbr2) => ({
                                        x1:
                                            index === 0
                                                ? X
                                                : (value.bands[index - 1].radius + gap) *
                                                Math.cos((nbr2 * Math.PI) / 180),
                                        y1:
                                            index === 0
                                                ? Y
                                                : (value.bands[index - 1].radius + gap) *
                                                Math.sin((nbr2 * Math.PI) / 180),
                                        x2: radius * Math.cos((nbr2 * Math.PI) / 180), // * pi / 180 => radians
                                        y2: radius * Math.sin((nbr2 * Math.PI) / 180),
                                        nbr: nbr2,
                                    }));
                                // return [nbr, nbr + 1 * 15, nbr + 5 * 15, nbr + 6 * 15].map(nbr2 => ({x1: X, y1: Y, x2: R * Math.cos(nbr2 *  Math.PI/180), y2: R * Math.sin(nbr2 *  Math.PI/180), nbr: nbr2}));
                                // return {x1: X, y1: Y, x2: R * Math.cos(nbr *  Math.PI/180), y2: R * Math.sin(nbr *  Math.PI/180), nbr}
                            })
                            .map((coordinate) => {
                                return {
                                    x1: X + coordinate.x1,
                                    y1: Y + coordinate.y1,
                                    x2: X + coordinate.x2,
                                    y2: Y + coordinate.y2,
                                    nbr: coordinate.nbr,
                                };
                            });
                    });
                }
            ),
            catchError((e, c) => c)
        );

        this.lines$ = this.form.valueChanges.pipe(
            startWith(this.form.value),
            map((value: { parts: number; expr: string; radius: number }) => {
                const parts = value.parts;
                const split: number[] = value.expr.split(',').map((el) => +el.trim());
                const partSize = 360 / parts;
                const expr = split.map((el) => el + 'x').join('+'); // eg. '3x+2x+1x'
                let x: number = solve(expr, partSize);
                const split2 = split.reduce((prev: number[], curr) => {
                    return [
                        ...prev,
                        (prev.length > 0 ? prev[prev.length - 1] : 0) + curr,
                    ];
                }, [] as Array<number>);

                return Array(parts)
                    .fill(0)
                    .map((x, i) => i * (360 / parts))
                    .flatMap((nbr) => {
                        return split2
                            .map((s) => nbr + s * x)
                            .map((nbr2) => ({
                                x1: X,
                                y1: Y,
                                x2: value.radius * Math.cos((nbr2 * Math.PI) / 180), // * pi / 180 => radians
                                y2: value.radius * Math.sin((nbr2 * Math.PI) / 180),
                                nbr: nbr2,
                            }));
                        // return [nbr, nbr + 1 * 15, nbr + 5 * 15, nbr + 6 * 15].map(nbr2 => ({x1: X, y1: Y, x2: R * Math.cos(nbr2 *  Math.PI/180), y2: R * Math.sin(nbr2 *  Math.PI/180), nbr: nbr2}));
                        // return {x1: X, y1: Y, x2: R * Math.cos(nbr *  Math.PI/180), y2: R * Math.sin(nbr *  Math.PI/180), nbr}
                    })
                    .map((coordinate) => {
                        return {
                            x1: X + coordinate.x1,
                            y1: Y + coordinate.y1,
                            x2: X + coordinate.x2,
                            y2: Y + coordinate.y2,
                            nbr: coordinate.nbr,
                        };
                    });
            }),
            catchError((e, c) => c)
        );

        // const colors = ['rgb(65, 84, 98)', 'white'];
        const colors = ['rgb(65, 84, 98)', 'rgb(65, 84, 98)'];
        // const colors: [['black', 'white']];

        this.triangles$ = this.bands$.pipe(
            map((bands) => {
                return bands.flatMap((lines, bandIndex) => {
                    const result = lines
                        .map((line, index) => {
                            const fill = colors[index % 2];
                            // const fill: string | undefined = undefined;
                            return index < lines.length - 1
                                ? {
                                    points: bandIndex === 0 ? [
                                        line.x1 + ' ' + line.y1,
                                        line.x2 + ' ' + line.y2,
                                        lines[index + 1].x2 + ' ' + lines[index + 1].y2,
                                    ].join(', ') : [
                                        line.x1 + ' ' + line.y1,
                                        line.x2 + ' ' + line.y2,
                                        lines[index + 1].x2 + ' ' + lines[index + 1].y2,
                                        lines[index + 1].x1 + ' ' + lines[index + 1].y1,
                                    ].join(', '),
                                    fill
                                }
                                : null;
                        })
                        .filter((triangle) => triangle !== null);
                    const firstLine = lines[0];
                    const lastLine = lines[lines.length - 1];
                    const fill: string | undefined = colors[lines.length % 2];
                    // const fill = undefined
                    if (bandIndex === 0) {
                        result.push({
                            points: [
                                lastLine.x1 + ' ' + lastLine.y1,
                                lastLine.x2 + ' ' + lastLine.y2,
                                firstLine.x2 + ' ' + firstLine.y2,
                            ].join(', '),
                            fill
                        });
                    } else {
                        result.push({
                            points: [
                                lastLine.x1 + ' ' + lastLine.y1,
                                lastLine.x2 + ' ' + lastLine.y2,
                                firstLine.x2 + ' ' + firstLine.y2,
                                firstLine.x1 + ' ' + firstLine.y1,
                            ].join(', '),
                            fill
                        });
                    }
                    return result;

                });
            })
        );

    }

    ngOnInit(): void {
    }

    onRemove(index: number) {
        this.bands.removeAt(index);
    }

    onAdd() {
        this.bands.push(
            new FormGroup({
                radius: new FormControl(R),
                parts: new FormControl(4),
                expr: new FormControl('2, 2'),
            })
        );
    }

    download() {

        const clone = this.svg.nativeElement.cloneNode(true);
        this.inkscapify(clone);
        this.downloadRef.nativeElement.firstChild?.remove();
        this.renderer.appendChild(this.downloadRef.nativeElement, clone);


        domtoimage.toSvg(this.downloadRef.nativeElement, {filter})
            .then((blob: any) => {
                FileSaver.saveAs(blob, 'img.svg')
            });

        // const svg = this.downloadRef.nativeElement.innerHTML;

        // const uint8Array = new Uint8Array(new ArrayBuffer(svg.length));
        // for (let i = 0, strLen = svg.length; i < strLen; i++) {
        //     uint8Array[i] = svg.charCodeAt(i);
        // }
        // const blob = new Blob([uint8Array], { type: 'text/csv;charset=utf-8' });
        // FileSaver.saveAs(blob, 'generative-angular.svg');

        // function filter(node: any) {
        //     if (node.nodeName !== '#comment') {
        //         return true;
        //     }
        //     return false;
        // }
        //
        // domtoimage.toSvg(this.svg.nativeElement, {filter})
        //     .then((blob: any) => {
        //         FileSaver.saveAs(blob, 'img.svg')
        //     });
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

function solve(
    expr: string,
    result: number,
    min = 0,
    max = 360,
    step = 1
): number {
    for (let i = min; i <= max; i = i + step) {
        let _result = evaluate(expr, {x: i});
        if (_result === result) {
            return i;
        }
        if (_result > result) {
            return step === 0.01 ? i : solve(expr, result, i - 1, i, step / 10);
        }
    }

    // todo
    return -1;
}

/*
        this.lines2$ =
            of(
                Array(4).fill(0)
                    .map((x, i) => i * 90)
                    .flatMap(nbr => {
                        return [nbr + 1 * 15, nbr + 5 * 15, nbr + 6 * 15].map(nbr2 => ({
                            x1: X,
                            y1: Y,
                            x2: R * Math.cos(nbr2 * Math.PI / 180),
                            y2: R * Math.sin(nbr2 * Math.PI / 180),
                            nbr: nbr2
                        }));
                        // return [nbr, nbr + 1 * 15, nbr + 5 * 15, nbr + 6 * 15].map(nbr2 => ({x1: X, y1: Y, x2: R * Math.cos(nbr2 *  Math.PI/180), y2: R * Math.sin(nbr2 *  Math.PI/180), nbr: nbr2}));
                        // return {x1: X, y1: Y, x2: R * Math.cos(nbr *  Math.PI/180), y2: R * Math.sin(nbr *  Math.PI/180), nbr}
                    })
                    .map((coordinate) => {
                        return {
                            x1: X + coordinate.x1,
                            y1: Y + coordinate.y1,
                            x2: X + coordinate.x2,
                            y2: Y + coordinate.y2,
                            nbr: coordinate.nbr
                        }
                    })
            ).pipe(
                tap((lines) => console.log('lines', lines))
            );

 */

function random<T>(array: T[] = []) {
    return array[Math.floor(Math.random() * array.length)];
}
