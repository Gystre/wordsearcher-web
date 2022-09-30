import { enc, SHA1 } from "crypto-js";

export const uploadToB2 = async (
    file: File,
    fileName: string,

    // these 2 come from the the server
    url: string,
    authorizationToken: string
) => {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () {
            // create sha1 hash for b2
            // TODO: find a built in solution so i don't have to rely on crypto-js (external library) for this
            // https://www.npmjs.com/package/sha1
            // crypto.createHash from node library exists but don't know how to use with files from input
            const hash = SHA1(enc.Latin1.parse(reader.result as string));
            const xhr = new XMLHttpRequest();

            xhr.addEventListener("load", function () {
                // console.info(`XHR response:`, this.response);

                resolve(xhr.response);
            });

            xhr.open("POST", url);

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
};
