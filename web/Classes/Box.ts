import { Point } from "./Point";

export class Box {
    klass: string;
    topLeft: Point; //x1, y1
    bottomRight: Point; //x2, y2
    score: number = 0;
    id: number; // used for binary search LMAO

    static nextId = 0;
    static unknownLabel = "*";

    constructor(
        klass: string,
        topLeft: Point,
        bottomRight: Point,
        score: number = 0
    ) {
        this.klass = klass;
        this.topLeft = topLeft;
        this.bottomRight = bottomRight;

        this.id = Box.getNextId();

        if (score) {
            this.score = score;
        }
    }

    static getNextId() {
        const ret = Box.nextId;
        Box.nextId++;
        return ret;
    }

    // if the coords were passed in as yolo (normalized 0-1) then convert to absolute coords (0-896)
    convertFromYolo(imgWidth: number, imgHeight: number) {
        this.topLeft.x *= imgWidth;
        this.topLeft.y *= imgHeight;
        this.bottomRight.x *= imgWidth;
        this.bottomRight.y *= imgHeight;
    }

    // returns NON YOLO coordinate box
    expand(padding: number) {
        const newBox = new Box(this.klass, this.topLeft, this.bottomRight);

        newBox.topLeft.x -= padding;
        newBox.topLeft.y -= padding;
        newBox.bottomRight.x += padding;
        newBox.bottomRight.y += padding;

        return newBox;
    }

    private intersects(other: Box) {
        return (
            this.topLeft.x < other.bottomRight.x &&
            this.bottomRight.x > other.topLeft.x &&
            this.topLeft.y < other.bottomRight.y &&
            this.bottomRight.y > other.topLeft.y
        );
    }

    intersectsOthers(boxes: Box[]) {
        for (const other of boxes) {
            if (this.intersects(other)) {
                return true;
            }
        }
        return false;
    }

    draw = (
        ctx: CanvasRenderingContext2D,
        color: string = "#00FF00",
        label?: string
    ) => {
        const font = "16px sans-serif";
        ctx.font = font;
        ctx.textBaseline = "top";

        // box for da box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.topLeft.x, this.topLeft.y, this.width, this.height);

        if (!label) return;

        // box for da text
        ctx.fillStyle = color;
        const textWidth = ctx.measureText(label).width;
        const textHeight = parseInt(font, 10);
        ctx.fillRect(
            this.topLeft.x - 1,
            this.topLeft.y - (textHeight + 2),
            textWidth + 2,
            textHeight + 2
        );

        // da text
        ctx.fillStyle = "#000000";
        ctx.fillText(
            label,
            this.topLeft.x - 1,
            this.topLeft.y - (textHeight + 2)
        );
    };

    drawLine = (
        ctx: CanvasRenderingContext2D,
        other: Box,
        color: string = "#00FF00",
        label?: string
    ) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.center.x, this.center.y);
        ctx.lineTo(other.center.x, other.center.y);
        ctx.stroke();

        if (!label) return;

        const font = "16px sans-serif";
        ctx.font = font;
        ctx.textBaseline = "top";

        // box for da text
        ctx.fillStyle = color;
        const textWidth = ctx.measureText(label).width;
        const textHeight = parseInt(font, 10);
        ctx.fillRect(
            this.topLeft.x - 1,
            this.topLeft.y - (textHeight + 2),
            textWidth + 2,
            textHeight + 2
        );

        // da text
        ctx.fillStyle = "#000000";
        ctx.fillText(
            label,
            this.topLeft.x - 1,
            this.topLeft.y - (textHeight + 2)
        );
    };

    get area() {
        return this.width * this.height;
    }

    get width() {
        return this.bottomRight.x - this.topLeft.x;
    }

    get height() {
        return this.bottomRight.y - this.topLeft.y;
    }

    get center() {
        return new Point(
            this.topLeft.x + this.width / 2,
            this.topLeft.y + this.height / 2
        );
    }

    get bottomLeft() {
        return new Point(this.topLeft.x, this.bottomRight.y);
    }

    get topRight() {
        return new Point(this.bottomRight.x, this.topLeft.y);
    }

    // UPDATE:
    // useless rn cuz not reliable so gonna let user delete boxes themselves on the frontend
    get type(): "lr" | "tr" | "invalid" {
        /*
            >1 = long rectangle [-]
            1 = square
            <1 = tall rectangle	[|]

            want something like 0.3 - 1.5, anything bigger could be words
        */
        // note: lots of false positives with lowercase letters, replace with tesseract in future
        const ratio = this.width / this.height;
        var type: "lr" | "tr" | "invalid" = "invalid";
        if (ratio >= 1.7) {
            type = "lr";
        } else if (ratio >= 0.2 && ratio <= 1.6) {
            type = "tr";
        }

        return type;
    }
}
