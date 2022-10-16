// i give up trying to organize this, maybe future kyle will figure out a way to do this better
// unhandled errors = 500
// ErrorCode = 200
export enum ErrorCode {
    // getSolve and insertSolve
    missingCreds,
    noEntry,

    // other stuff
    invalidUrl, // url is not a valid image
    invalidImage, // good url but not an image
    modelNotLoaded, // models weren't loaded when func was called
    wordsearchNotFound, // no wordsearch found in image
    b2UploadUrlFailed, // getting the upload url from b2 didn't work
    b2UploadFailed, // sending the actual file itself to b2 no worky
    imageTooBig, // image over 15mb
}
