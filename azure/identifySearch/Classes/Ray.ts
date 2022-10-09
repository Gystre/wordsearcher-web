import { Box } from "./Box";
import { Point } from "./Point";

export type RayDirection = "up" | "down" | "left" | "right" | "uknownDirection";

export class Ray {
    origin: Point;
    direction: Point;
    distance: number;
    ignore?: Box;

    constructor(
        origin: Point,
        direction: RayDirection,
        distance: number,
        ignore: Box | undefined = undefined
    ) {
        this.origin = origin;

        this.direction = new Point(0, 0);
        if (direction == "up") {
            this.direction = new Point(0, -1);
        } else if (direction == "down") {
            this.direction = new Point(0, 1);
        } else if (direction == "left") {
            this.direction = new Point(-1, 0);
        } else if (direction == "right") {
            this.direction = new Point(1, 0);
        }
        this.distance = distance;

        if (ignore) this.ignore = ignore;
    }

    private lineIntersectsLine(
        line1Start: Point,
        line1End: Point,
        line2Start: Point,
        line2End: Point
    ) {
        const denominator =
            (line2End.y - line2Start.y) * (line1End.x - line1Start.x) -
            (line2End.x - line2Start.x) * (line1End.y - line1Start.y);

        if (denominator == 0) return false;

        const numerator1 =
            (line2End.x - line2Start.x) * (line1Start.y - line2Start.y) -
            (line2End.y - line2Start.y) * (line1Start.x - line2Start.x);

        const numerator2 =
            (line1End.x - line1Start.x) * (line1Start.y - line2Start.y) -
            (line1End.y - line1Start.y) * (line1Start.x - line2Start.x);

        const r = numerator1 / denominator;
        const s = numerator2 / denominator;

        return !(r < 0 || r > 1 || s < 0 || s > 1);
    }

    private hit(box: Box): boolean {
        // thank u random dude for ur post from 2007 on an obscure game dev forum
        const v1 = this.origin;
        const v2 = new Point(
            this.origin.x + this.direction.x * this.distance,
            this.origin.y + this.direction.y * this.distance
        );

        // check each line for intersection
        if (this.lineIntersectsLine(v1, v2, box.topLeft, box.bottomLeft))
            return true;
        if (this.lineIntersectsLine(v1, v2, box.bottomLeft, box.bottomRight))
            return true;
        if (this.lineIntersectsLine(v1, v2, box.topLeft, box.topRight))
            return true;
        if (this.lineIntersectsLine(v1, v2, box.topRight, box.bottomRight))
            return true;
        return false;
    }

    cast(boxes: Box[]): Box[] {
        let boxesHit: Box[] = [];
        for (let box of boxes) {
            // check if box is in ignore list
            if (box == this.ignore) {
                continue;
            }

            if (this.hit(box)) {
                boxesHit.push(box);
            }
        }
        return boxesHit;
    }

    static castMultiple(rays: Ray[], boxes: Box[], ignore?: Box) {
        let rayHits: { ray: Ray; boxes: Box[] }[] = [];

        // push on some empty objs
        for (let ray of rays) {
            rayHits.push({ ray: ray, boxes: [] });
        }

        for (let box of boxes) {
            if (box == ignore) {
                continue;
            }

            for (let i = 0; i < rays.length; i++) {
                if (rays[i].hit(box)) {
                    rayHits[i].boxes.push(box);
                }
            }
        }
        return rayHits;
    }

    draw(ctx: CanvasRenderingContext2D, color: string = "#00FF00") {
        ctx.beginPath();
        ctx.moveTo(this.origin.x, this.origin.y);
        ctx.lineTo(
            this.origin.x + this.direction.x * this.distance,
            this.origin.y + this.direction.y * this.distance
        );
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.closePath();
    }

    get end(): Point {
        return new Point(
            this.origin.x + this.direction.x * this.distance,
            this.origin.y + this.direction.y * this.distance
        );
    }

    get directionString(): RayDirection {
        if (this.direction.x == -1) {
            return "left";
        } else if (this.direction.x == 1) {
            return "right";
        } else if (this.direction.y == -1) {
            return "up";
        } else if (this.direction.y == 1) {
            return "down";
        }

        return "uknownDirection";
    }
}
