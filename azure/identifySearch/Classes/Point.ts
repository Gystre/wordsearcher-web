export class Point {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    static dist(origin: Point, dest: Point) {
        const x = Math.pow(dest.x - origin.x, 2);
        const y = Math.pow(dest.y - origin.y, 2);
        return Math.sqrt(x + y);
    }

    draw(ctx: CanvasRenderingContext2D, color: string = "#00FF00") {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.closePath();
    }
}
