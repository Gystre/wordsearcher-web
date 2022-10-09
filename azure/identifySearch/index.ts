import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { io, Rank, Tensor, Tensor3D } from "@tensorflow/tfjs-core";
import {
    browser,
    dispose,
    GraphModel,
    image as tfImage,
    loadGraphModel,
    ones,
    tidy,
} from "@tensorflow/tfjs-node";
import { createCanvas, ImageData, loadImage } from "canvas";
import { ErrorCode } from "../shared/ErrorCode";
import { createGridArray } from "./createGridArray";
let fs = require("fs");

var loading = true;
var identifierModel: GraphModel<string | io.IOHandler> | null = null;
var gridModel: GraphModel<string | io.IOHandler> | null = null;

const identifierPromise = loadGraphModel(
    `https://xaist2.github.io/wordsearcher-identifier_7-5-2022/model.json`,
    {
        onProgress: () => {
            loading = true;
        },
    }
);

const gridPromise = loadGraphModel(
    `https://xaist2.github.io/wordsearcher-grid_8-12-2022/model.json`,
    {
        onProgress: () => {
            loading = true;
        },
    }
);

// load the models and tesseract.js before the function can begin
Promise.all([identifierPromise, gridPromise]).then(
    async ([identifier, grid]) => {
        // pass garbage input to "warm up" the model and make subsequent invocations faster
        const idInput = ones(identifier.inputs[0].shape as number[]);
        const gInput = ones(grid.inputs[0].shape as number[]);
        const prom1 = identifier.executeAsync(idInput);
        const prom2 = grid.executeAsync(gInput);

        const results = await Promise.all([prom1, prom2]);
        dispose(results);
        dispose(idInput);
        dispose(gInput);

        identifierModel = identifier;
        gridModel = grid;
        loading = false;
    }
);

export const run: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    const url = req.query.url;

    // check if models are loaded before downloading anything
    if (loading) {
        context.res = {
            body: { error: ErrorCode.modelNotLoaded },
        };
        return;
    }

    // download url into a html imge
    var image: any = null;
    try {
        await loadImage(url).then((downloadedImage) => {
            image = downloadedImage;
        });
    } catch (e) {
        context.res = {
            body: { error: ErrorCode.invalidUrl },
        };
        return;
    }

    const idCanvas = createCanvas(896, 896);
    const ctx = idCanvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, idCanvas.width, idCanvas.height);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, idCanvas.width, idCanvas.height);
    const ratio = Math.min(
        idCanvas.width / image.naturalWidth,
        idCanvas.height / image.naturalHeight
    );
    const newWidth = Math.round(image.naturalWidth * ratio);
    const newHeight = Math.round(image.naturalHeight * ratio);
    ctx.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
        (idCanvas.width - newWidth) / 2,
        (idCanvas.height - newHeight) / 2,
        newWidth,
        newHeight
    );

    if (loading || !identifierModel || !gridModel) {
        context.res = {
            body: { error: ErrorCode.modelNotLoaded },
        };
        return;
    }

    let [identifierModelWidth, identifierModelHeight] =
        identifierModel.inputs[0].shape!.slice(1, 3);
    const input = tidy(() => {
        return tfImage
            .resizeBilinear(browser.fromPixels(idCanvas as any), [
                identifierModelWidth,
                identifierModelHeight,
            ])
            .div(255)
            .expandDims(0);
    });

    await identifierModel.executeAsync(input).then(async (res) => {
        // TODO: change to highest confidence box
        const [boxes, scores, classes, validDetections] = res as Tensor<Rank>[];
        // const idBoxesData = boxes.dataSync();
        // const idScoresData = scores.dataSync();
        // const idClassesData = classes.dataSync();
        const idValidDetectionsData = validDetections.dataSync()[0];

        if (idValidDetectionsData === 0) {
            context.res = {
                body: { error: ErrorCode.wordsearchNotFound },
            };
            return;
        }

        // pass the word search to the grid identifier
        // 15px padding
        const firstBox = boxes.dataSync().slice(0, 4);
        const xPadding = 15 / idCanvas.width;
        const yPadding = 15 / idCanvas.height;

        if (!gridModel) {
            context.res = {
                body: { error: ErrorCode.modelNotLoaded },
            };
            return;
        }

        // y1, x1, y2, x2???
        let [gridModelWidth, gridModelHeight] =
            gridModel.inputs[0].shape!.slice(1, 3);
        var croppedInput = tidy(() => {
            return tfImage.cropAndResize(
                input as Tensor<Rank.R4>,
                [
                    [
                        firstBox[1] - yPadding,
                        firstBox[0] - xPadding,
                        firstBox[3] + yPadding,
                        firstBox[2] + xPadding,
                    ],
                ],
                [0],
                [gridModelWidth, gridModelHeight]
            );
        });

        await gridModel.executeAsync(croppedInput).then(async (res) => {
            const [gBoxes, gScores, gClasses, gValidDetections] =
                res as Tensor<Rank>[];

            // could probs perform the reshape before dataSync() for better performance
            // no idea tho lololol
            const gValidDetectionsData = gValidDetections.dataSync()[0];
            const gBoxesData = Array.from(
                gBoxes.dataSync().slice(0, 4 * gValidDetectionsData)
            );
            const gScoresData = Array.from(
                gScores.dataSync().slice(0, gValidDetectionsData)
            );
            const gClassesData = Array.from(
                gClasses.dataSync().slice(0, gValidDetectionsData)
            );

            const gridImage = createCanvas(gridModelWidth, gridModelHeight);
            const squeezed = croppedInput.squeeze();
            const gridArray = await browser.toPixels(squeezed as Tensor3D);

            const imageData = new ImageData(
                gridArray,
                gridImage.width,
                gridImage.height
            );
            gridImage.getContext("2d")!.putImageData(imageData, 0, 0);
            // drawBoxes(
            //     gridImage,
            //     gBoxesData,
            //     gScoresData,
            //     gClassesData,
            //     gValidDetectionsData,
            //     gridLabels
            // );
            // gridImage
            //     .createPNGStream()
            //     .pipe(
            //         fs.createWriteStream(path.join(__dirname, "..", "grid.png"))
            //     );

            const grid = await createGridArray(
                gridModelWidth,
                gridModelHeight,
                gridImage,
                gBoxesData,
                gScoresData,
                gClassesData,
                gValidDetectionsData
            );

            context.res = {
                body: JSON.stringify({
                    croppedInput: convertFromYolo(
                        firstBox[0] - xPadding,
                        firstBox[1] - yPadding,
                        firstBox[2] + xPadding,
                        firstBox[3] + yPadding,
                        idCanvas.width,
                        idCanvas.height
                    ),
                    grid,
                    // gBoxesData,
                    // gScoresData,
                    // gClassesData,
                    // gValidDetectionsData,
                }),
            };

            dispose(res);
        });

        dispose(croppedInput);
        dispose(input);
        dispose(res);
    });
};

const convertFromYolo = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    imgWidth: number,
    imgHeight: number
) => {
    return {
        x1: x1 * imgWidth,
        y1: y1 * imgHeight,
        x2: x2 * imgWidth,
        y2: y2 * imgHeight,
    };
};

export default run;
