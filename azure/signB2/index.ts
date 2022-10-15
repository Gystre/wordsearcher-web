import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import B2 from "backblaze-b2";
import { object, string } from "yup";
import { ErrorCode } from "../shared/ErrorCode";
import { genFileName } from "../shared/genFileName";
import { UrlData } from "../shared/UrlData";

const createS3Schema = object().shape({
    fileName: string().min(1).max(255).required(),
    fileType: string()
        .min(1)
        .test("FILE_TYPE", "File must be an image", (value) => {
            if (!value) return true;

            return value.includes("image/");
        })
        .required(),
});

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    const fileName = req.query.fileName;
    const fileType = req.query.fileType;

    if (
        !process.env.B2_KEY_ID ||
        !process.env.B2_APPLICATION_KEY ||
        !process.env.B2_BUCKET_ID
    ) {
        context.res = {
            status: 500,
            body: "Missing B2 credentials",
        };
    }

    try {
        await createS3Schema.validate({ fileName, fileType });
    } catch (e: any) {
        context.res = {
            status: 500,
            body: { error: e.message },
        };
        return;
    }

    // get signed backblaze url
    const b2 = new B2({
        applicationKeyId: process.env.B2_KEY_ID as string,
        applicationKey: process.env.B2_APPLICATION_KEY as string,
    });

    await b2.authorize();

    const url = await b2.getUploadUrl({
        bucketId: process.env.B2_BUCKET_ID as string,
    });

    if (url.status != "200") {
        context.res = {
            status: 500,
            body: {
                error: ErrorCode.b2UploadUrlFailed,
            },
        };
        return;
    }

    if (url.status != "200") {
        context.res = {
            status: 500,
            body: {
                error: "Create B2 upload url failed and returned " + url.status,
            },
        };
    }

    const data: UrlData = url.data;

    context.res = {
        body: {
            uploadUrl: data.uploadUrl,
            authorizationToken: data.authorizationToken,
            fileName: genFileName(fileName),
        },
    };
};

export default httpTrigger;
