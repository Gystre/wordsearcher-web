import { addDoc, collection } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { array, number, object, string } from "yup";
import { Collections, db } from "../../firebase/client";

const maxLen = 1000;
const validateQuery = object().shape({
  url: string().url().min(1).max(maxLen).required(),
  croppedInput: object()
    .shape({
      x1: number().required(),
      y1: number().required(),
      x2: number().required(),
      y2: number().required(),
    })
    .required(),
  grid: array().max(maxLen).required(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // only allow post requests
  if (req.method !== "POST") {
    res.status(405).json({ error: "Only post requests are allowed" });
    return;
  }

  if (!req.body) {
    res.status(400).json({ error: "Missing JSON in request body" });
    return;
  }

  const body = JSON.parse(req.body);

  try {
    validateQuery.validateSync(body);
  } catch (e) {
    res.status(400).json({ error: e });
    return;
  }

  // TODO: verify url is valid and is image

  const url = body.url;
  const grid = body.grid;
  const croppedInput = body.croppedInput;

  // insert into database
  const solve = await addDoc(collection(db, Collections.solves), {
    url,
    grid: JSON.stringify(grid),
    croppedInput: JSON.stringify(croppedInput),
    createdAt: new Date(),
  });

  res.status(201).json({
    id: solve.id,
  });
}
