import { Canvas } from "canvas";

export const drawBoxes = (
    canvas: Canvas,
    boxesData: number[],
    scoresData: number[],
    classesData: number[],
    validDetectionsData: number,
    labels: string[]
) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const font = "16px sans";
    ctx.font = font;
    ctx.textBaseline = "top";

    for (let i = 0; i < validDetectionsData; ++i) {
        const klass = labels[classesData[i]];
        const score = scoresData[i].toFixed(2);

        let [x1, y1, x2, y2] = boxesData.slice(i * 4, (i + 1) * 4);
        x1 *= canvas.width;
        x2 *= canvas.width;
        y1 *= canvas.height;
        y2 *= canvas.height;
        const width = x2 - x1;
        const height = y2 - y1;

        var fillColor = "";
        const floatScore = parseFloat(score);
        if (floatScore >= 0.9) {
            fillColor = "#00FF00";
        } else if (floatScore < 0.9 && floatScore >= 0.7) {
            fillColor = "#FFA500";
        } else {
            fillColor = "#FF0000";
        }

        // Draw the bounding box.
        ctx.strokeStyle = fillColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y1, width, height);

        // Draw the label background.
        ctx.fillStyle = fillColor;
        const textWidth = ctx.measureText(klass + ":" + score).width;
        const textHeight = parseInt(font, 10); // base 10
        ctx.fillRect(
            x1 - 1,
            y1 - (textHeight + 2),
            textWidth + 2,
            textHeight + 2
        );
    }
    for (var i = 0; i < validDetectionsData; ++i) {
        let [x1, y1, ,] = boxesData.slice(i * 4, (i + 1) * 4);
        x1 *= canvas.width;
        y1 *= canvas.height;
        const klass = labels[classesData[i]];
        const score = scoresData[i].toFixed(2);

        // Draw the text last to ensure it's on top.
        ctx.fillStyle = "#000000";
        const textHeight = parseInt(font, 10);
        ctx.fillText(klass + ":" + score, x1 - 1, y1 - (textHeight + 2));
    }
};
