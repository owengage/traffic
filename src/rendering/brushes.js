export const black = {
    activate(ctx) {}
}

export const guideline = {
    activate(ctx) {
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'red';
    }
};

export const line_colour = (colour) => ({
    activate(ctx) {
        ctx.strokeStyle = colour;
    }
});

export const body_fill = {
    activate(ctx) {
        ctx.fillStyle = '#369';
    }
};

export const body_fill_colour = (colour) => ({
    activate(ctx) {
        ctx.fillStyle = colour;
    }
});

export const tyre_fill = {
    activate(ctx) {
        ctx.fillStyle = '#000';
    }
};

