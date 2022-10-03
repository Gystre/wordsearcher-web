import { CosmosClient } from "@azure/cosmos";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { number, object } from "yup";

enum ErrorCode {
    clientError,
    databaseError,
    containerError,
}

const validateQuery = object().shape({
    uid: number().positive().integer().min(10000000).max(99999999).required(),
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

    // get the item from the database
    const { resources } = await container?.items
        .query(`select * from c where c.uid = ${uid}`)
        .fetchAll();

    const ret = {
        uid: resources[0].uid,
        url: resources[0].url,
        croppedInput: resources[0].croppedInput,
        gBoxesData: resources[0].gBoxesData,
        gScoresData: resources[0].gScoresData,
        gClassesData: resources[0].gClassesData,
        gValidDetectionsData: resources[0].gValidDetectionsData,
        createdOn: resources[0].createdOn,
    };

    context.res = {
        body: ret,
    };
};

export default httpTrigger;
