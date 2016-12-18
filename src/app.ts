class App {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private animationId: number;

    private iteration: number = 0;

    private points: Point[] = [];
    private lines: Line[] = [];

    private LINES_COUNT = 100;
    private POINTS_COUNT = 5;
    private KILL_RATE = 0.05; // ration
    private BIRTH_RATE = 0.05; // ratio
    private MUTATION = 10; // pixels
    private PAIRING_TOLERANCE = 0.1; // ratio

    constructor () {
        let button = <HTMLButtonElement> document.createElement('button');
        button.innerHTML = 'Stabilize solution';
        document.body.insertAdjacentElement('beforeBegin', button);
        button.addEventListener('click', (e: MouseEvent) => {
            this.stabilize();
            (<HTMLElement> e.target).parentNode.removeChild(<HTMLElement> e.target);
        });

        this.canvas = <HTMLCanvasElement> document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx = this.canvas.getContext('2d');
        document.body.insertAdjacentElement('beforeBegin', this.canvas);
        this.canvas.addEventListener('click', (e: MouseEvent) => {
            this.points.push({ x: e.pageX, y: e.pageY });
            this.render();
        });

        this.points = this.getPoints(this.POINTS_COUNT);
        this.lines = this.getLines(this.LINES_COUNT);

        this.run();
    }

    public run (): void {
        this.render();
        this.iteration++;

        this.animationId = window.requestAnimationFrame(() => {
            this.evolve();
            this.run();
        });
    }

    public stop (): void {
        window.cancelAnimationFrame(this.animationId);
    }

    public stabilize (): void {
        this.BIRTH_RATE = 0;
        this.KILL_RATE = 0.51;
        this.MUTATION = 0;
    }

    public render (): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderLines();
        this.renderPoints();
        this.renderFitness();
    }

    private getPoints (count: number = 10): Point[] {
        let points: Point[] = [];
        for (let i = 0; i < count; i++) {
            points.push({
                x: Math.round(Math.random() * this.canvas.width),
                y: Math.round(Math.random() * this.canvas.height)
            });
        }
        return points;
    }

    private getLines (count: number = 10): Line[] {
        let lines: Line[] = [];
        for (let i = 0; i < count; i++) {
            let p1 = {
                x: Math.round(Math.random() * this.canvas.width),
                y: Math.round(Math.random() * this.canvas.height)
            };
            let p2 = {
                x: Math.round(Math.random() * this.canvas.width),
                y: Math.round(Math.random() * this.canvas.height)
            };
            lines.push({
                start: p1.x < p2.x ? p1 : p2,
                end: p1.x < p2.x ? p2 : p1
            });
        }
        return lines;
    }

    private getMutation(): number {
        return (Math.random() * this.MUTATION) - (this.MUTATION / 2);
    }

    private evolve (): void {
        let kill = Math.floor(this.lines.length * this.KILL_RATE);
        let birth = Math.floor(this.lines.length * this.BIRTH_RATE);
        this.lines.splice(this.lines.length - kill, kill);

        let pairs: Line[][] = [];
        while (this.lines.length >= 2) {
            let pair: Line[] = [];
            pair.push(this.lines.shift());
            // pair.push(this.lines.splice(this.lines.length >= 2 ? Math.round(Math.random()) : 0, 1)[0]);
            pair.push(this.lines.splice(Math.floor(Math.random() * this.lines.length * this.PAIRING_TOLERANCE), 1)[0]);
            pairs.push(pair);
        }

        while (pairs.length > 0) {
            let pair = pairs.pop();
            let first = pair[0];
            let second = pair[1];
            let child = {
                start: {
                    x: (first.start.x + second.start.x) / 2,
                    y: (first.start.y + second.start.y) / 2
                },
                end: {
                    x: (first.end.x + second.end.x) / 2,
                    y: (first.end.y + second.end.y) / 2
                }
            };
            this.lines.push({
                start: {
                    x: child.start.x + this.getMutation(),
                    y: child.start.y + this.getMutation()
                },
                end: {
                    x: child.end.x + this.getMutation(),
                    y: child.end.y + this.getMutation()
                }
            });
            if (this.MUTATION > 0) {
                this.lines.push({
                    start: {
                        x: child.start.x + this.getMutation(),
                        y: child.start.y + this.getMutation()
                    },
                    end: {
                        x: child.end.x + this.getMutation(),
                        y: child.end.y + this.getMutation()
                    }
                });
            }
        }

        this.lines = this.lines.concat(this.getLines(birth));

        // evalueate fitness
        for (let line of this.lines) {
            let fitness = 0;
            let dAB = Math.sqrt(Math.pow(line.end.x - line.start.x, 2) + Math.pow(line.end.y - line.start.y, 2));
            for (let point of this.points) {
                let dAC = Math.sqrt(Math.pow(point.x - line.start.x, 2) + Math.pow(point.y - line.start.y, 2));
                let aBA0 = Math.asin((line.end.y - line.start.y) / dAB);
                if (line.end.x < line.start.x) {
                    aBA0 = Math.PI - aBA0;
                } else if (line.end.y < line.start.y) {
                    aBA0 = 2 * Math.PI + aBA0;
                }
                let aCA0 = Math.asin((point.y - line.start.y) / dAC);
                if (point.x < line.start.x) {
                    aCA0 = Math.PI - aCA0;
                } else if (point.y < line.start.y) {
                    aCA0 = 2 * Math.PI + aCA0;
                }
                let aCAB = Math.abs(aCA0 - aBA0);
                if (aCAB > Math.PI) aCAB -= Math.PI;
                let d = dAC * Math.sin(aCAB);
                fitness += d;
            }
            line.fitness = fitness / this.points.length;
        }
        this.lines.sort((a, b) => a.fitness - b.fitness);
    }

    private renderPoints (): void {
        this.ctx.fillStyle = '#000';
        this.ctx.strokeStyle = '#d00';
        this.ctx.lineWidth = 1;

        for (let point of this.points) {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI, false);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI, false);
            this.ctx.stroke();
        }
    }

    private renderLines (): void {
        this.ctx.strokeStyle = this.MUTATION > 0 ? 'rgba(0,0,0,0.25)' : '#000';
        this.ctx.lineWidth = this.MUTATION > 0 ? 1 : 2;

        for (let line of this.lines) {
            let p = (line.end.y - line.start.y) / (line.end.x - line.start.x);
            let q = line.start.y - p * line.start.x;

            let start: Point = {
                x: 0,
                y: p * 0 + q
            };

            let end: Point = {
                x: this.canvas.width,
                y: p * this.canvas.width + q
            };

            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();

            // this.ctx.beginPath();
            // this.ctx.fillStyle = 'rgba(200,0,0,0.25)';
            // this.ctx.arc(line.start.x, line.start.y, 2, 0, 2 * Math.PI, false);
            // this.ctx.fill();
            //
            // this.ctx.beginPath();
            // this.ctx.fillStyle = 'rgba(0,200,0,0.25)';
            // this.ctx.arc(line.end.x, line.end.y, 2, 0, 2 * Math.PI, false);
            // this.ctx.fill();
        }
    }

    private renderFitness (): void {
        let average = 0;
        let worst = 0;

        this.ctx.strokeStyle = 'rgba(0,0,200, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let i = 0; i < this.lines.length; i++) {
            this.ctx.moveTo(this.canvas.width - this.lines.length + i - 0.5, this.canvas.height);
            this.ctx.lineTo(this.canvas.width - this.lines.length + i - 0.5, this.canvas.height - (this.lines[i].fitness / this.points.length));
            average += this.lines[i].fitness;
            worst = Math.max(worst, this.lines[i].fitness);
        }
        this.ctx.stroke();

        average /= this.lines.length;

        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillStyle = '#000';
        this.ctx.fillText(average.toFixed(1), this.canvas.width - 10, this.canvas.height - 10);
        this.ctx.fillText(worst.toFixed(1), this.canvas.width - 10, this.canvas.height - 25);
        this.ctx.fillText((average / worst).toFixed(2), this.canvas.width - 10, this.canvas.height - 40);
    }
}
