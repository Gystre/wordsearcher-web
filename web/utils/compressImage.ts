export const compressImage = (file: File) => {
    return new Promise<File>((resolve, reject) => {
        var reader = new FileReader();
        reader.readAsArrayBuffer(file);

        reader.onload = function () {
            // create blob and turn into image
            var image = new Image();
            image.src = URL.createObjectURL(new Blob([file]));
            image.onload = async function () {
                // image is probs coming from mobile phone, cut in half
                var resized: File | null = null;
                if (image.width > 3000 || image.height > 3000) {
                    console.log("width > 3000, cutting image res in half");
                    resized = await resize(image, 0.5);
                } else if (image.width > 1000 || image.height > 1000) {
                    console.log("width > 1000, resizing image");
                    resized = await resize(image, 0.9);
                }

                if (resized) {
                    resolve(resized);
                }
                resolve(file);
            };
        };
    });
};

async function resize(image: HTMLImageElement, resizeFactor: number) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const originalWidth = image.width;
    const originalHeight = image.height;

    const canvasWidth = originalWidth * resizeFactor;
    const canvasHeight = originalHeight * resizeFactor;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    context?.drawImage(
        image,
        0,
        0,
        originalWidth * resizeFactor,
        originalHeight * resizeFactor
    );

    // save canvas as blob
    return await new Promise<File>(function (resolve) {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    const file = new File([blob], "test.jpg", {
                        type: "image/jpeg",
                    });
                    resolve(file);
                }
            },
            "image/jpeg",
            0.7
        );
    });
}
