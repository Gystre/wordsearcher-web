import { CosmosClient } from "@azure/cosmos";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { object, string } from "yup";
import { ErrorCode } from "../shared/ErrorCode";

const client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT as string,
    key: process.env.COSMOS_KEY as string,
});
const database = client.database(process.env.COSMOS_DATABASE as string);
const container = database.container(process.env.COSMOS_CONTAINER as string);

const validateQuery = object().shape({
    uid: string()
        .matches(/^[a-z0-9]+$/)
        .min(8)
        .max(8)
        .required(),
});

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    const uid = req.query.uid;

    try {
        validateQuery.validateSync(req.query);
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
    // get the item from the database
    const results = await container?.items
        .query(`select * from c where c.uid = '${uid}'`)
        .fetchAll();

    if (results.resources.length === 0) {
        context.res = {
            body: { error: ErrorCode.noEntry },
        };
        return;
    }

    const resource = results.resources[0];
    const ret = {
        uid: resource.uid,
        url: resource.url,
        croppedInput: resource.croppedInput,
        gBoxesData: resource.gBoxesData,
        gScoresData: resource.gScoresData,
        gClassesData: resource.gClassesData,
        gValidDetectionsData: resource.gValidDetectionsData,
        createdOn: resource.createdOn,
    };

    context.res = {
        body: JSON.stringify(ret),
    };
};

export default httpTrigger;
