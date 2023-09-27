import B2 from "backblaze-b2";
import type { NextApiRequest, NextApiResponse } from "next";
import { object, string } from "yup";
import { UrlData } from "./shared/UrlData";
import { genFileName } from "./shared/genFileName";

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const fileName = req.query.fileName as string;
  const fileType = req.query.fileType as string;

  if (
    !process.env.NEXT_PUBLIC_B2_KEY_ID ||
    !process.env.NEXT_PUBLIC_B2_APPLICATION_KEY ||
    !process.env.NEXT_PUBLIC_B2_BUCKET_ID
  ) {
    res.status(500).json({ error: "Missing B2 credentials" });
    return;
  }

  try {
    await createS3Schema.validate({ fileName, fileType });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
    return;
  }

  // get signed backblaze url
  const b2 = new B2({
    applicationKeyId: process.env.NEXT_PUBLIC_B2_KEY_ID as string,
    applicationKey: process.env.NEXT_PUBLIC_B2_APPLICATION_KEY as string,
  });

  console.log(b2);

  await b2.authorize();

  const url = await b2.getUploadUrl({
    bucketId: process.env.NEXT_PUBLIC_B2_BUCKET_ID as string,
  });

  console.log("url", url);

  if (url.status != "200") {
    res.status(500).json({
      error: "Create B2 upload url failed and returned " + url.status,
    });
    return;
  }

  const data: UrlData = url.data;

  console.log("data", data);

  res.status(200).json({
    uploadUrl: data.uploadUrl,
    authorizationToken: data.authorizationToken,
    fileName: genFileName(fileName),
  });
}
