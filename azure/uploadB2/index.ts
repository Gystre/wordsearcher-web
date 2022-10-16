import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import B2 from "backblaze-b2";
import { Canvas, Image } from "canvas";
import fetch from "node-fetch";
import { object, string } from "yup";
import { ErrorCode } from "../shared/ErrorCode";
import { genFileName } from "../shared/genFileName";
import { UrlData } from "../shared/UrlData";

const urlSchema = object().shape({
    url: string().url().required(),
});

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    const url: string = req.body && req.body.url;

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
        await urlSchema.validate({ url });
    } catch (e: any) {
        context.res = {
            body: { error: e.message },
        };
        return;
    }

    // BUG: this will break if the url is smthn like https://example.com/image.image.png
    // could fix with fat ass if statement with every popular image extension but 2 much work
    const fileNameMaybeExtension = url.split("/").pop();
    var extension = fileNameMaybeExtension?.split(".").pop();
    const hasExtension = extension != fileNameMaybeExtension;
    var fileName = "";
    if (hasExtension && extension != undefined) {
        // the file is guaranteed to have an extension here since the extension variable exists
        fileName = fileNameMaybeExtension as string;
        fileName = fileName.slice(0, -extension.length - 1);
    } else {
        fileName = fileNameMaybeExtension + ".png";
    }

    // download image and upload to b2
    const b2 = new B2({
        applicationKeyId: process.env.B2_KEY_ID as string,
        applicationKey: process.env.B2_APPLICATION_KEY as string,
    });
    await b2.authorize();

    const uploadUrlResponse = await b2.getUploadUrl({
        bucketId: process.env.B2_BUCKET_ID as string,
    });

    if (uploadUrlResponse.status != "200") {
        context.res = {
            status: 500,
            body: {
                error: ErrorCode.b2UploadUrlFailed,
            },
        };
        return;
    }

    // fetch image
    const response = await fetch(url);
    if (!response.ok) {
        context.res = {
            status: 500,
            body: {
                error: ErrorCode.invalidUrl,
            },
        };
        return;
    }

    const type = response.headers.get("content-type");
    if (type) {
        extension = type.split("/").pop();
    } else {
        extension = "png";
    }
    var buffer = await response.buffer();

    const image = await new Promise<Image>((resolve, reject) => {
        var image = new Image();
        image.src = url; // fetching this twice but wutever
        image.onload = function () {
            resolve(image);
        };
    });

    // compress
    if (image.width >= 1000 || image.height >= 1000) {
        var resizeFactor = 0.9;
        if (image.width >= 3000 || image.height >= 3000) {
            resizeFactor = 0.5;
        }
        console.log("compressing image: ", resizeFactor);

        const canvas = new Canvas(image.width, image.height);
        const ctx = canvas.getContext("2d");

        const originalWidth = image.width;
        const originalHeight = image.height;

        const canvasWidth = originalWidth * resizeFactor;
        const canvasHeight = originalHeight * resizeFactor;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.drawImage(
            image,
            0,
            0,
            originalWidth * resizeFactor,
            originalHeight * resizeFactor
        );

        const compBuffer = canvas.toBuffer("image/jpeg");
        if (compBuffer.length < buffer.length) {
            console.log(
                "compressed image, saved: ",
                ((buffer.length - compBuffer.length) / 1000 / 1000).toFixed(2),
                "mb"
            );
            extension = "jpg";
            buffer = compBuffer;
        }
    }

    // upload
    const data: UrlData = uploadUrlResponse.data;

    // upload file
    const newFileName = genFileName(fileName);
    const uploadResponse = await b2.uploadFile({
        uploadUrl: data.uploadUrl,
        uploadAuthToken: data.authorizationToken,
        fileName: newFileName,
        data: buffer,
    });
    if (uploadResponse.status != "200") {
        context.res = {
            status: 500,
            body: {
                error: ErrorCode.b2UploadFailed,
            },
        };
        return;
    }

    // FUTURE KYLE
    // file not uploaded? was working earlier

    console.log(uploadResponse);
    console.log("fileName:", fileName);
    console.log("newFileName:", newFileName);
    console.log("extension:", extension);

    context.res = {
        body: `https://${process.env.NEXT_PUBLIC_B2_BUCKET}.${process.env.NEXT_PUBLIC_B2_ENDPOINT}/${newFileName}.${extension}`,
    };
};

export default httpTrigger;
