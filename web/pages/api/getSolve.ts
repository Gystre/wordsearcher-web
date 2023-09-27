import { doc, getDoc } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { object, string } from "yup";
import { Collections, db } from "../../firebase/client";

const validateQuery = object().shape({
  uid: string().required(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const uid = req.query.uid as string;

  try {
    validateQuery.validateSync(req.query);
  } catch (e) {
    res.status(400).json({ error: e });
    return;
  }

  // fetch the item
  const solveRef = doc(db, Collections.solves, uid);
  const solveDoc = await getDoc(solveRef);

  if (!solveDoc.exists()) {
    res.status(404).json({ error: "No such document" });
    return;
  }

  const solve = solveDoc.data();

  res.status(200).json(solve);
}
