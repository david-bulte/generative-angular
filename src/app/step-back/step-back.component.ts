import { Component, HostListener, OnInit } from '@angular/core';
import { BehaviorSubject, interval, Subject } from 'rxjs';
import { filter, map, switchMap, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-root-2',
    templateUrl: './step-back.component.html',
    styleUrls: ['./step-back.component.css']
})
export class StepBackComponent implements OnInit {

    numbers = Array(100).fill(0).map((x, i) => i);
    strokeDasharray$ = interval(10).pipe(
        map(time => time % 11),
        map(x => {
            return `${0 + x} ${10 - x}`
        }),
    );

    mousedown$$ = new Subject();
    a$$ = new BehaviorSubject(0.01);
    lines$ = this.a$$.pipe(map(a => {
        let xs = [...this.numbers.map(x => -1 * x), ...this.numbers];
        xs = xs.map(x => x / 10);
        xs.splice(xs.indexOf(0), 1);
        xs.sort((a, b) => a - b);
        console.log(xs);
        // const formula = (x: number) => 2 * a * x * x - 1 * x + 1;
        // const formula = (x: number) => 180 - Math.sin(x) * a * 100;

        const _a = 1.0;
        const b = 8.0;
        const c = 0;
        const formula = (x: number) => _a*Math.sin(b*x)*(-1)^c;
        const lines: Line[] = xs.map(formula).reduce((prev: Line[], curr, index) => {
            if (prev.length === 0) {
                return [{x2: index, y2: curr}];
            } else {
                const {x2, y2} = prev[index - 1];
                return [...prev, {x1: x2, y1: y2, x2: index, y2: curr}]
            }
        }, []);
        lines.shift();
        return lines;
    }));

    @HostListener('window:mousedown') onDown() {
        this.mousedown$$.next(true);
    }

    @HostListener('window:mouseup') onUp() {
        this.mousedown$$.next(false);
    }

    ngOnInit(): void {
        let mousedown$ = this.mousedown$$.pipe(filter(mousedown => !!mousedown, true));
        let mouseup$ = this.mousedown$$.pipe(filter(mousedown => !mousedown, true));
        mousedown$.pipe(switchMap(() => interval(100).pipe(takeUntil(mouseup$)))).subscribe(() => this.a$$.next(this.a$$.getValue() + 0.01))
    }

}

interface Line {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number
};
