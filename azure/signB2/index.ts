import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import B2 from "backblaze-b2";
import { object, string } from "yup";

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

function yyyymmdd() {
    var x = new Date();
    var y = x.getFullYear().toString();
    var m = (x.getMonth() + 1).toString();
    var d = x.getDate().toString();
    d.length == 1 && (d = "0" + d);
    m.length == 1 && (m = "0" + m);
    var yyyymmdd = y + m + d;
    return yyyymmdd;
}

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    const fileName = req.query.fileName || (req.body && req.body.fileName);
    const fileType = req.query.fileType || (req.body && req.body.fileType);

    try {
        await createS3Schema.validate({ fileName, fileType });
    } catch (e: any) {
        context.res = {
            status: 500,
            body: { error: e.message }, // share code between functions, was a guide somewhere :P
        };
        return;
    }

    // generate safe file name
    const date = yyyymmdd();
    const randomString = Math.random().toString(36).substring(2, 7);
    const cleanFileName = fileName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const newName = `images/${date}-${randomString}-${cleanFileName}`;

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
            body: { error: "Failed and returned " + url.status },
        };
    }

    type UrlData = {
        authorizationToken: string;
        bucketId: string;
        uploadUrl: string;
    };

    const data: UrlData = url.data;

    context.res = {
        body: {
            uploadUrl: data.uploadUrl,
            authorizationToken: data.authorizationToken,
            fileName: newName,
        },
    };
};

export default httpTrigger;
