export enum ErrorCode {
    // getSolve and insertSolve
    missingCreds,
    noEntry,

    // identifySearch
    invalidUrl, // url is not a valid image
    modelNotLoaded,
    wordsearchNotFound,
    b2UploadUrlFailed,
    b2UploadFailed,
}
