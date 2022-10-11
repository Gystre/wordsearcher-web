import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import Tesseract from "tesseract.js";

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    // doesn't work LMAO
    const { data } = await Tesseract.recognize(
        "https://tesseract.projectnaptha.com/img/eng_bw.png",
        "eng"
    );
    console.log(data.text);
    context.res = {
        body: data.text,
    };
};

export default httpTrigger;
