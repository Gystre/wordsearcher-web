import { enc, SHA1 } from "crypto-js";
import { compressImage } from "./compressImage";
import { noExtension } from "./noExtension";

/*
Possible to avoid crypto-js by using smaller library?
Lower priority rn since crypto-js is only 50kb
*/

export const uploadToB2 = async (file: File) => {
    if (!/image/i.test(file.type)) {
        throw new Error("File is not an image");
    }

    const compFile = await compressImage(file);
    const savedBytes = file.size - compFile.size;
    console.log(compFile);

    if (savedBytes > 0) {
        console.log("compressed image, saved:", savedBytes / 1000000, "mb");
        file = compFile;
    }

    const response = await fetch(
        `https://wordsearcher.azurewebsites.net/api/signB2?fileName=${noExtension(
            file.name
        )}&fileType=${file.type}`
    );

    const data = await response.json();
    const { uploadUrl, authorizationToken, fileName } = data;

    var ret: any = await new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () {
            const hash = SHA1(enc.Latin1.parse(reader.result as string));
            const xhr = new XMLHttpRequest();

            xhr.addEventListener("load", function () {
                resolve(xhr.response);
            });

            xhr.open("POST", uploadUrl);

            xhr.setRequestHeader("Content-Type", file.type);
            xhr.setRequestHeader("Authorization", authorizationToken);
            xhr.setRequestHeader("X-Bz-File-Name", fileName);
            xhr.setRequestHeader("X-Bz-Content-Sha1", hash.toString());

            xhr.send(file);
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsBinaryString(file);
    });
    ret = JSON.parse(ret);
    if (ret.status === 400) {
        throw new Error(ret.message);
    }

    // get type from file.type
    return `https://${process.env.NEXT_PUBLIC_B2_BUCKET}.${
        process.env.NEXT_PUBLIC_B2_ENDPOINT
    }/${fileName}.${file.type.split("/")[1]}`;
};
