import { CosmosClient } from "@azure/cosmos";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { array, number, object, string } from "yup";
import { ErrorCode } from "../shared/ErrorCode";

const client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT as string,
    key: process.env.COSMOS_KEY as string,
});
const database = client.database(process.env.COSMOS_DATABASE as string);
const container = database.container(process.env.COSMOS_CONTAINER as string);

const maxLen = 1000;
const validateQuery = object().shape({
    url: string().url().min(1).max(maxLen).required(),
    croppedInput: object()
        .shape({
            x1: number().required(),
            y1: number().required(),
            x2: number().required(),
            y2: number().required(),
        })
        .required(),
    grid: array().max(maxLen).required(),
});

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    if (!req.body) {
        context.res = {
            body: "Missing JSON in request body",
        };
        return;
    }

    try {
        validateQuery.validateSync(req.body);
    } catch (e) {
        context.res = {
            body: { error: e },
        };
        return;
    }

    if (
        !process.env.COSMOS_ENDPOINT ||
        !process.env.COSMOS_KEY ||
        !process.env.COSMOS_DATABASE ||
        !process.env.COSMOS_CONTAINER
    ) {
        context.res = {
            body: { error: ErrorCode.missingCreds },
        };
    }

    // generate random 8 length lowercase alphanumeric id
    const uid = Math.random().toString(36).substring(2, 10);

    // TODO: verify url is valid and is image
    const url = req.body.url;
    const croppedInput = req.body.croppedInput;
    const gBoxesData = req.body.gBoxesData;
    const gScoresData = req.body.gScoresData;
    const gClassesData = req.body.gClassesData;
    const gValidDetectionsData = req.body.gValidDetectionsData;
    const { resource } = await container.items.create({
        uid,
        url,
        croppedInput,
        gBoxesData,
        gScoresData,
        gClassesData,
        gValidDetectionsData,
        createdOn: Date.now(),
        readableDate: new Date().toISOString(),
    });

    context.res = {
        body: JSON.stringify(resource),
    };
};

export default httpTrigger;
