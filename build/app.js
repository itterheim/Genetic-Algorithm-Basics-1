var App = (function () {
    function App() {
        var _this = this;
        this.iteration = 0;
        this.points = [];
        this.lines = [];
        this.LINES_COUNT = 100;
        this.POINTS_COUNT = 5;
        this.KILL_RATE = 0.05;
        this.BIRTH_RATE = 0.05;
        this.MUTATION = 10;
        this.PAIRING_TOLERANCE = 0.1;
        var button = document.createElement('button');
        button.innerHTML = 'Stabilize solution';
        document.body.insertAdjacentElement('beforeBegin', button);
        button.addEventListener('click', function (e) {
            _this.stabilize();
            e.target.parentNode.removeChild(e.target);
        });
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx = this.canvas.getContext('2d');
        document.body.insertAdjacentElement('beforeBegin', this.canvas);
        this.canvas.addEventListener('click', function (e) {
            _this.points.push({ x: e.pageX, y: e.pageY });
            _this.render();
        });
        this.points = this.getPoints(this.POINTS_COUNT);
        this.lines = this.getLines(this.LINES_COUNT);
        this.run();
    }
    App.prototype.run = function () {
        var _this = this;
        this.render();
        this.iteration++;
        this.animationId = window.requestAnimationFrame(function () {
            _this.evolve();
            _this.run();
        });
    };
    App.prototype.stop = function () {
        window.cancelAnimationFrame(this.animationId);
    };
    App.prototype.stabilize = function () {
        this.BIRTH_RATE = 0;
        this.KILL_RATE = 0.51;
        this.MUTATION = 0;
    };
    App.prototype.render = function () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderLines();
        this.renderPoints();
        this.renderFitness();
    };
    App.prototype.getPoints = function (count) {
        if (count === void 0) { count = 10; }
        var points = [];
        for (var i = 0; i < count; i++) {
            points.push({
                x: Math.round(Math.random() * this.canvas.width),
                y: Math.round(Math.random() * this.canvas.height)
            });
        }
        return points;
    };
    App.prototype.getLines = function (count) {
        if (count === void 0) { count = 10; }
        var lines = [];
        for (var i = 0; i < count; i++) {
            var p1 = {
                x: Math.round(Math.random() * this.canvas.width),
                y: Math.round(Math.random() * this.canvas.height)
            };
            var p2 = {
                x: Math.round(Math.random() * this.canvas.width),
                y: Math.round(Math.random() * this.canvas.height)
            };
            lines.push({
                start: p1.x < p2.x ? p1 : p2,
                end: p1.x < p2.x ? p2 : p1
            });
        }
        return lines;
    };
    App.prototype.getMutation = function () {
        return (Math.random() * this.MUTATION) - (this.MUTATION / 2);
    };
    App.prototype.evolve = function () {
        var kill = Math.floor(this.lines.length * this.KILL_RATE);
        var birth = Math.floor(this.lines.length * this.BIRTH_RATE);
        this.lines.splice(this.lines.length - kill, kill);
        var pairs = [];
        while (this.lines.length >= 2) {
            var pair = [];
            pair.push(this.lines.shift());
            pair.push(this.lines.splice(Math.floor(Math.random() * this.lines.length * this.PAIRING_TOLERANCE), 1)[0]);
            pairs.push(pair);
        }
        while (pairs.length > 0) {
            var pair = pairs.pop();
            var first = pair[0];
            var second = pair[1];
            var child = {
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
        for (var _i = 0, _a = this.lines; _i < _a.length; _i++) {
            var line = _a[_i];
            var fitness = 0;
            var dAB = Math.sqrt(Math.pow(line.end.x - line.start.x, 2) + Math.pow(line.end.y - line.start.y, 2));
            for (var _b = 0, _c = this.points; _b < _c.length; _b++) {
                var point = _c[_b];
                var dAC = Math.sqrt(Math.pow(point.x - line.start.x, 2) + Math.pow(point.y - line.start.y, 2));
                var aBA0 = Math.asin((line.end.y - line.start.y) / dAB);
                if (line.end.x < line.start.x) {
                    aBA0 = Math.PI - aBA0;
                }
                else if (line.end.y < line.start.y) {
                    aBA0 = 2 * Math.PI + aBA0;
                }
                var aCA0 = Math.asin((point.y - line.start.y) / dAC);
                if (point.x < line.start.x) {
                    aCA0 = Math.PI - aCA0;
                }
                else if (point.y < line.start.y) {
                    aCA0 = 2 * Math.PI + aCA0;
                }
                var aCAB = Math.abs(aCA0 - aBA0);
                if (aCAB > Math.PI)
                    aCAB -= Math.PI;
                var d = dAC * Math.sin(aCAB);
                fitness += d;
            }
            line.fitness = fitness / this.points.length;
        }
        this.lines.sort(function (a, b) { return a.fitness - b.fitness; });
    };
    App.prototype.renderPoints = function () {
        this.ctx.fillStyle = '#000';
        this.ctx.strokeStyle = '#d00';
        this.ctx.lineWidth = 1;
        for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
            var point = _a[_i];
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI, false);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI, false);
            this.ctx.stroke();
        }
    };
    App.prototype.renderLines = function () {
        this.ctx.strokeStyle = this.MUTATION > 0 ? 'rgba(0,0,0,0.25)' : '#000';
        this.ctx.lineWidth = this.MUTATION > 0 ? 1 : 2;
        for (var _i = 0, _a = this.lines; _i < _a.length; _i++) {
            var line = _a[_i];
            var p = (line.end.y - line.start.y) / (line.end.x - line.start.x);
            var q = line.start.y - p * line.start.x;
            var start = {
                x: 0,
                y: p * 0 + q
            };
            var end = {
                x: this.canvas.width,
                y: p * this.canvas.width + q
            };
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
        }
    };
    App.prototype.renderFitness = function () {
        var average = 0;
        var worst = 0;
        this.ctx.strokeStyle = 'rgba(0,0,200, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (var i = 0; i < this.lines.length; i++) {
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
    };
    return App;
}());
//# sourceMappingURL=app.js.map