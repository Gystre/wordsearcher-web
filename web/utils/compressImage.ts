import { noExtension } from "./noExtension";

export const compressImage = (file: File, quality: number = 0.7) => {
    return new Promise<File>((resolve, reject) => {
        var reader = new FileReader();
        reader.readAsArrayBuffer(file);

        reader.onload = function (event) {
            // blob stuff
            var blob = new Blob([file]); // create blob...
            window.URL = window.URL || window.webkitURL;
            var blobURL = window.URL.createObjectURL(blob); // and get it's URL

            // helper Image object
            var image = new Image();
            image.src = blobURL;
            image.onload = function () {
                // have to wait till it's loaded
                var resized = resizeMe(image, quality); // send it to canvas

                resolve(
                    new File([resized], noExtension(file.name) + ".jpg", {
                        type: "image/jpeg",
                    })
                );
            };
        };
    });
};

// i think this is in pixels
const MAX_WIDTH = 4000;
const MAX_HEIGHT = 4000;

function resizeMe(img: HTMLImageElement, quality: number) {
    var width = img.width;
    var height = img.height;

    // calculate the width and height, constraining the proportions
    if (width > height) {
        if (width > MAX_WIDTH) {
            //height *= MAX_WIDTH / width;
            height = Math.round((height *= MAX_WIDTH / width));
            width = MAX_WIDTH;
        }
    } else {
        if (height > MAX_HEIGHT) {
            //width *= MAX_HEIGHT / height;
            width = Math.round((width *= MAX_HEIGHT / height));
            height = MAX_HEIGHT;
        }
    }

    // resize the canvas and draw the image data into it
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx?.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", quality); // get the data from canvas as 70% JPG (can be also PNG, etc.)
}
