import { CosmosClient } from "@azure/cosmos";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { array, number, object, string } from "yup";

enum ErrorCode {
    clientError,
    databaseError,
    containerError,
}

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
    gBoxesData: array()
        .max(maxLen * 4)
        .required(),
    gScoresData: array().max(maxLen).required(),
    gClassesData: array().max(maxLen).required(),
    gValidDetectionsData: number().positive().integer().max(maxLen).required(),
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

    // make a call to cosmos db to insert a new entry
    // triple try catch LMAO
    var client = null;
    try {
        client = new CosmosClient({
            endpoint: process.env.COSMOS_ENDPOINT as string,
            key: process.env.COSMOS_KEY as string,
        });
    } catch (e) {
        context.res = {
            body: { error: ErrorCode.clientError },
        };
        return;
    }

    var database = null;
    try {
        database = client?.database(process.env.COSMOS_DATABASE as string);
    } catch (e) {
        context.res = {
            body: { error: ErrorCode.databaseError },
        };
        return;
    }

    var container = null;
    try {
        container = database?.container(process.env.COSMOS_CONTAINER as string);
    } catch (e) {
        context.res = {
            body: { error: ErrorCode.containerError },
        };
        return;
    }

    // generate random 8 digit id
    const uid = Math.floor(10000000 + Math.random() * 90000000);

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
