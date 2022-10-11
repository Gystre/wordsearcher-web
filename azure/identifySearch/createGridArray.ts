import { Canvas, createCanvas as createCanvasLib } from "canvas";
import { Box } from "./Classes/Box";
import { Point } from "./Classes/Point";
import { Ray } from "./Classes/Ray";

// FUTURE KYLE:
// Different results with this image: https://cdn.discordapp.com/attachments/200994742782132224/1027442963686637578/badaccuracy.jpg
// azure: https://cdn.discordapp.com/attachments/200994742782132224/1027770356573945916/grid.png
// react: https://cdn.discordapp.com/attachments/200994742782132224/1027770639572021329/unknown.png

const numberConfusions: { [key: string]: string } = {
    "0": "O",
    "1": "I", // could be I, J, or L depending on case

    // use tesseract.js for these
    // "2": "S",
    // "3": "S",
    // "5": "E",
    // "8": "B",
    // "9": "P",
};

// TODO: figure out a way to reduce the amount of params lmao
export const createGridArray = async (
    gridImage: Canvas,
    boxesData: number[],
    scoresData: number[],
    classesData: number[],
    validDetectionsData: number
): Promise<Box[][]> => {
    console.log(
        "%c --- CREATING GRIDDDD ---",
        "font-weight: bold; font-size: 20px;"
    );

    var boxes: Box[] = [];

    // array of indicies to keep track of any invalidly labeled boxes
    var numbersIdx = [];

    // use to correct 1's and 0's to characters
    var letters = 0;
    var mainlyLetters = false;

    // more boxes = greater totalArea = more full grid of letters
    var totalArea = 0;

    // create new canvas element and append to canvasContainer id
    const tempCanvasses: ReturnType<typeof createCanvas>[] = [];

    for (let i = 0; i < validDetectionsData; ++i) {
        const klass = gridLabels[classesData[i]];
        const score = scoresData[i];
        let [x1, y1, x2, y2] = boxesData.slice(i * 4, (i + 1) * 4);

        const box = new Box(klass, new Point(x1, y1), new Point(x2, y2), score);
        box.convertFromYolo(gridImage.width, gridImage.height);

        const newLength = boxes.push(box);
        totalArea += box.area;

        // check class of character
        if (box.klass.match(/[A-Z]/)) {
            letters++;
        } else {
            numbersIdx.push(newLength - 1);
        }
    }

    // delete any boxes that are way bigger or way smaller than the average area
    const avgArea = totalArea / boxes.length;
    for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];
        if (
            box.klass != "I" &&
            box.klass != "J" &&
            box.klass != "L" &&
            (box.area > avgArea * 2.5 || box.area < avgArea / 2.5)
        ) {
            console.log("deleted", boxes[i]);

            boxes.splice(i, 1);
            i--;
            continue;
        }

        // need to do this here to avoid adding any deleted boxes being added to tempCanvases
        if (box.score < 0.4) {
            tempCanvasses.push(createCanvas(gridImage, box));
        }
    }

    // more than half are letters
    if (numbersIdx.length > 0 && letters / boxes.length > 0.5) {
        mainlyLetters = true;

        console.log(
            `Over half of labels are letters and found ${numbersIdx.length} labels with numbers, changing to similar looking characters...`
        );

        for (let i = 0; i < numbersIdx.length; i++) {
            const box = boxes[numbersIdx[i]];

            const match = numberConfusions[box.klass];
            if (!match) {
                // console.log(`No match for ${box.klass} -> ?`);
            } else {
                // const oldClass = box.klass;
                // console.log(`${oldClass} -> ${numberConfusions[oldClass]}`);
                box.klass = match;
            }
        }
    }

    // detect really bad coverage
    const coverage = totalArea / (gridImage.width * gridImage.height);
    if (coverage < 0.1) {
        console.log(
            "WARNING: not a lot of detected boxes, precision will probably be pretty bad"
        );
        console.log("total coverage: ", (coverage * 100).toFixed(1) + "%");
    }

    // create an approximation of the grid (could have holes so we'll check for that now)
    var { grid, topBoxes, bottomBoxes, leftBoxes, rightBoxes } = sortBoxesArray(
        boxes,
        gridImage
    );

    /*
        find holes in the grid
    */
    // 1. find average padding for the rays
    var avgPad = 0;
    var avgWidth = 0;
    var avgHeight = 0;
    var validBoxes = 0;
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            const box = grid[r][c];

            // ignoring I's since they're usually pretty small, maybe add L's?
            if (!box || box.klass == "I" || box.klass == "J") continue;
            avgWidth += box.width;
            avgHeight += box.height;
            validBoxes++;
        }

        // we don't want the last element in the row since the padding to the right is 0
        for (let c = 0; c < grid[r].length - 1; c++) {
            const box = grid[r][c];
            const nextBox = grid[r][c + 1];

            if (!box || !nextBox) continue;

            avgPad += Point.dist(box.bottomRight, nextBox.bottomLeft);
        }
    }
    avgWidth /= validBoxes;
    avgHeight /= validBoxes;
    avgPad /= boxes.length;

    // 2. cast the rays in all 4 directions
    // TODO: can cut execution time in half by skipping every other box to do the 4 way raycast since there's a lot of overlap rn
    const newBoxes = boxes.slice(0);

    var holesCount = 0;
    for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];

        const extraDistance = avgPad * 0.3;

        const rays = [];
        const uRay = new Ray(
            new Point(box.center.x, box.center.y - box.height / 2),
            "up",
            avgPad + extraDistance
        );

        const dRay = new Ray(
            new Point(box.center.x, box.center.y + box.height / 2),
            "down",
            avgPad + extraDistance
        );

        const lRay = new Ray(
            new Point(box.bottomLeft.x, box.bottomLeft.y - box.height / 2),
            "left",
            avgPad + extraDistance
        );

        const rRay = new Ray(
            new Point(box.bottomRight.x, box.bottomRight.y - box.height / 2),
            "right",
            avgPad + extraDistance
        );

        // avoid casting rays that go out of bounds
        if (!topBoxes.has(box)) rays.push(uRay);
        if (!bottomBoxes.has(box)) rays.push(dRay);
        if (!leftBoxes.has(box)) rays.push(lRay);
        if (!rightBoxes.has(box)) rays.push(rRay);

        const rayHits = Ray.castMultiple(rays, boxes, box);
        for (let c = 0; c < rayHits.length; c++) {
            const rayHit = rayHits[c];

            if (rayHit.boxes.length == 0) {
                const ray = rayHit.ray;
                ray.distance -= extraDistance;

                // create the new box
                var topLeft = new Point(0, 0);
                var bottomRight = new Point(0, 0);
                if (ray.directionString == "up") {
                    bottomRight = new Point(box.bottomRight.x, ray.end.y);
                } else if (ray.directionString == "down") {
                    topLeft = new Point(box.topLeft.x, ray.end.y);
                } else if (ray.directionString == "left") {
                    bottomRight = new Point(ray.end.x, box.bottomRight.y);
                } else if (ray.directionString == "right") {
                    topLeft = new Point(ray.end.x, box.topLeft.y);
                }

                if (
                    ray.directionString == "down" ||
                    ray.directionString == "right"
                ) {
                    bottomRight = new Point(
                        topLeft.x + avgWidth,
                        topLeft.y + avgHeight
                    );
                } else {
                    topLeft = new Point(
                        bottomRight.x - avgWidth,
                        bottomRight.y - avgHeight
                    );
                }

                const newBox = new Box(Box.unknownLabel, topLeft, bottomRight);

                if (!newBox.intersectsOthers(newBoxes)) {
                    newBoxes.push(newBox);

                    // save the image to a canvas and add it to the tempCanvases to receive a label
                    const temp = createCanvas(gridImage, newBox);
                    tempCanvasses.push(temp);

                    holesCount++;
                }
            }
        }
    }
    if (holesCount > 0) console.log(holesCount + " holes found");

    boxes = newBoxes;

    // doesn't work in every situation, so needs more testing
    // take all the temp canvases and put them into collectiveTemp for processing by tesseract
    if (tempCanvasses.length > 0) {
        // sort to prepare for binary search
        boxes.sort((a, b) => a.id - b.id);

        const collectiveTemp = createCanvasLib(0, 0);
        const ctx = collectiveTemp.getContext("2d");
        if (!ctx) return [[]];

        // collect the width and get the max height
        var width = 0;
        var height = tempCanvasses[0].canvas.height;

        for (let i = 0; i < tempCanvasses.length; i++) {
            const canvas = tempCanvasses[i].canvas;
            width += canvas.width;

            if (canvas.height > height) {
                height = canvas.height;
            }
        }
        collectiveTemp.width = width;
        collectiveTemp.height = height;

        //draw all the image onto the collectiveTemp
        var nextX = 0;
        for (let i = 0; i < tempCanvasses.length; i++) {
            const canvas = tempCanvasses[i].canvas;

            // draw it in the center
            ctx.drawImage(canvas, nextX, (height - canvas.height) / 2);
            nextX += canvas.width;
        }

        // FUTURE KYLE:
        // tesseract js worker loading giving a lot of problems
        // gonna comment out until can find a solution later
        // const {
        //     data: { text },
        // } = await tessWorker.recognize(collectiveTemp.toBuffer("image/png"));
        // const {
        //     data: { text },
        // } = await Tesseract.recognize(collectiveTemp.toBuffer("image/png"));

        // const cleaned = cleanString(text);
        const cleaned = "";
        if (cleaned.length > 0) console.log("Tesseract result: " + cleaned);

        if (mainlyLetters) {
            cleaned.replace("1", "I");
            cleaned.replace("0", "O");
        }

        if (cleaned.length <= tempCanvasses.length) {
            for (let i = 0; i < cleaned.length; i++) {
                const id = tempCanvasses[i].id;

                // binary search to find box
                var low = 0;
                var high = boxes.length - 1;
                while (low <= high) {
                    var mid = Math.floor((low + high) / 2);

                    var box = boxes[mid];
                    if (box.id === id) {
                        box.klass = cleaned[i];
                        break;
                    } else if (box.id < id) {
                        low = mid + 1;
                    } else {
                        high = mid - 1;
                    }
                }
            }
            console.log(
                `Successfully labeled ${cleaned.length} low acc and/or missing boxes`
            );
        } else {
            console.log(
                `Tesseract created more letters than were missing.\nTesseract string: ${cleaned}\nTesseract string count: ${cleaned.length} vs Missing + low acc boxes: ${tempCanvasses.length}`
            );
        }
    }
    // fixed the holes, reconstruct the grid
    grid = sortBoxesArray(newBoxes, gridImage).grid;

    console.log(`${grid[0].length}x${grid.length}`);

    // print out ret in a square unsortedGrid
    var print = "";
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            const box = grid[r][c];
            if (!box) {
                print += "_ ";
            } else {
                print += box.klass + " ";
                box.draw(gridImage.getContext("2d"), "green", box.klass);
            }
        }
        print += "\n";
    }
    console.log(print);

    // save image
    // gridImage
    //     .createPNGStream()
    //     .pipe(fs.createWriteStream(path.join(__dirname, "..", "grid.png")));

    return grid;
};

/*
1d array of detections only has positional data, no awareness of dimension
2d grid only has dimesions which could be thrown off by 1 or 2 missing boxes, ruining the algorithm
This function is for creating a new grid everytime we create and prune boxes from the 1d array to keep the 2d grid as accurate as possible
*/
const sortBoxesArray = (boxes: Box[], gridImage: Canvas) => {
    // TODO: probs consolidate into 1 loop
    // draw a ray upwards, if it doesn't hit anything then we know we're still in the top row otherwise stop and we've found our dimension
    const sortedByY = boxes.slice(0).sort((a, b) => a.center.y - b.center.y);
    var cols = 0;
    for (let i = 0; i < sortedByY.length; i++) {
        const box = sortedByY[i];

        const ray = new Ray(
            new Point(box.center.x, box.topLeft.y), // need subtract 1 to prevent hitting itself
            "up",
            gridImage.height,
            box
        );

        if (ray.cast(boxes).length > 0) {
            cols = i;
            break;
        }
    }

    const sortedByX = boxes.slice(0).sort((a, b) => a.center.x - b.center.x);
    var rows = 0;
    for (let i = 0; i < sortedByX.length; i++) {
        const box = sortedByX[i];

        const ray = new Ray(
            new Point(box.topLeft.x, box.center.y),
            "left",
            gridImage.width,
            box
        );
        if (ray.cast(boxes).length > 0) {
            rows = i;
            break;
        }
    }

    // reshape the array
    const unsortedGrid: Box[][] = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            row.push(sortedByY[idx]);
        }
        unsortedGrid.push(row);
    }

    if (unsortedGrid.length * unsortedGrid[0].length != boxes.length) {
        console.log(
            `WARNING: created unsortedGrid length (${
                unsortedGrid.length * unsortedGrid[0].length
            }) != total detected boxes length (${
                boxes.length
            }), some boxes were left out`
        );
    }

    // grid is already sorted by y so just sort by x
    const grid: Box[][] = [];
    unsortedGrid.forEach((row) =>
        grid.push(row.sort((a, b) => a.center.x - b.center.x))
    );

    // for the hole detection
    // top most boxes (first elements of sorted by y)
    const topBoxes = new Set<Box>();
    for (let i = 0; i < cols; i++) {
        topBoxes.add(sortedByY[i]);
    }

    // bottom most boxes (last elements)
    const bottomBoxes = new Set<Box>();
    for (let i = sortedByY.length - cols; i < sortedByY.length; i++) {
        bottomBoxes.add(sortedByY[i]);
    }

    // left most (first elements of sorted by x)
    const leftBoxes = new Set<Box>();
    for (let i = 0; i < rows; i++) {
        leftBoxes.add(sortedByX[i]);
    }

    // right most (last elements)
    const rightBoxes = new Set<Box>();
    for (let i = sortedByX.length - rows; i < sortedByX.length; i++) {
        rightBoxes.add(sortedByX[i]);
    }

    return {
        grid,
        topBoxes,
        bottomBoxes,
        leftBoxes,
        rightBoxes,
    };
};

// expand box and create an empty canvas to hold the image the box contains
const createCanvas = (tempCanvas: Canvas, box: Box) => {
    const expanded = box.expand(3);
    const temp = createCanvasLib(expanded.width, expanded.height);
    temp.getContext("2d")?.drawImage(
        tempCanvas,
        expanded.topLeft.x,
        expanded.topLeft.y,
        expanded.width,
        expanded.height,
        0,
        0,
        expanded.width,
        expanded.height
    );

    return { canvas: temp, id: box.id };
};

export const gridLabels = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
];
