import Point from 'traffic/point';

function trace_poly(ctx, poly) {
    ctx.beginPath();
    ctx.moveTo(poly.points[0].x, poly.points[0].y);
    for (const point of poly.points) {
        ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
}

export default class Renderer {
    constructor(canvas, centre, scale) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scale = scale;
        this.centre = centre;
    }

    get scale() {
        return this._scale;
    }

    set scale(value) {
        this._scale = value;
        this._world_width = this.canvas.width / value;
        this._world_height = this.canvas.height / value;
    }

    get centre() {
        return this._centre;
    }

    set centre(value) {
        this._centre = value;
        this._translation_vector = value
            .negate()
            .add(new Point(this._world_width/2, this._world_height/2));
    }

    view_bounds() {
        const half_width = this._world_width / 2;
        const half_height = this._world_height / 2;
        return {
            x: { min: this.centre.x - half_width, max: this.centre.x + half_width },
            y: { min: this.centre.y - half_height, max: this.centre.y + half_height },
        };
    }

    grid(brush, width) {
        const view = this.view_bounds();
        const start_x = width * Math.floor(view.x.min / width);
        const end_x = width * Math.ceil(view.x.max / width);
        for (let x = start_x; x <= end_x; x += width) {
            this.stroke_path(brush, [
                new Point(x, view.y.min),
                new Point(x, view.y.max),
            ]);
        }

        const start_y = width * Math.floor(view.y.min / width);
        const end_y = width * Math.ceil(view.y.max / width);
        for (let y = start_y; y <= end_y; y += width) {
            this.stroke_path(brush, [
                new Point(view.x.min, y),
                new Point(view.x.max, y),
            ]);
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    fill_polygon(brush, poly) {
        poly = poly
            .trans(this._translation_vector)
            .scalar_mult(this.scale);

        this._with_brush(brush, () => {
            trace_poly(this.ctx, poly);
            this.ctx.fill();
        });
    }

    stroke_polygon(brush, poly) {
        poly = poly
            .trans(this._translation_vector)
            .scalar_mult(this.scale);
        
        this._with_brush(brush, () => {
            trace_poly(this.ctx, poly);
            this.ctx.stroke();
        });
    }

    stroke_arc(brush, centre, radius, start=0, end=2*Math.PI) {
        centre = centre
            .add(this._translation_vector)
            .scalar_mult(this.scale);
        radius *= this.scale;

        this._with_brush(brush, () => {
            this.ctx.beginPath();
            this.ctx.arc(centre.x, centre.y, radius, start, end);
            this.ctx.stroke();        
        });
    }
    
    stroke_path(brush, points) {
        this._with_brush(brush, () => {
            this.ctx.moveTo(points[0].x, points[0].y);
            this.ctx.beginPath();
            for (let p of points) {
                p = p.add(this._translation_vector).scalar_mult(this.scale);
                this.ctx.lineTo(p.x, p.y);
            }
            this.ctx.stroke();
        });
    }

    label(point, text) {
        point = point
            .add(this._translation_vector)
            .scalar_mult(this.scale)
            .add(new Point(10,10));

        const brush = {
            activate(ctx) {
                ctx.font = "15px Arial";
            }
        };
        this._with_brush(brush, () => {
            this.ctx.fillText(text, point.x, point.y);
        });
    }

    _with_brush(brush, fn) {
        this.ctx.save();
        brush.activate(this.ctx);
        fn();
        this.ctx.restore();
    }
}

