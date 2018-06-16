import Point from './point';

function trace_poly(ctx, poly) {
    ctx.beginPath();
    ctx.moveTo(poly.points[0].x, poly.points[0].y);
    for (const point of poly.points) {
        ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
}

export default class Renderer {
    constructor(ctx, centre, scale) {
        this.ctx = ctx;
        this.centre = centre; // TODO: not really centre. It's top-left.
        this.scale = scale;
    }

    fill_polygon(brush, poly) {
        poly = poly
            .trans(this.centre.negate())
            .scalar_mult(this.scale);

        this._with_brush(brush, () => {
            trace_poly(this.ctx, poly);
            this.ctx.fill();
        });
    }

    stroke_polygon(brush, poly) {
        poly = poly
            .trans(this.centre.negate())
            .scalar_mult(this.scale);
        
        this._with_brush(brush, () => {
            trace_poly(this.ctx, poly);
            this.ctx.stroke();
        });
    }

    stroke_arc(brush, centre, radius, start=0, end=2*Math.PI) {
        centre = centre
            .add(this.centre.negate())
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
                p = p.sub(this.centre).scalar_mult(this.scale);
                this.ctx.lineTo(p.x, p.y);
            }
            this.ctx.stroke();
        });
    }

    label(point, text) {
        point = point
            .sub(this.centre)
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

