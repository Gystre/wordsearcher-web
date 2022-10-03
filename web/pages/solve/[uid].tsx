import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";

type Data = {
    uid: number;
    url: string;
    croppedInput: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    };
    gBoxesData: number[];
    gScoresData: number[];
    gClassesData: number[];
    gValidDetectionsData: number;
    createdOn: number;
};

const Solve: NextPage = () => {
    const router = useRouter();
    const { uid } = router.query;

    const [data, setData] = useState<Data | null>(null);

    useEffect(() => {
        if (uid) {
            fetch(
                `https://wordsearcher.azurewebsites.net/api/getSolve?uid=${uid}`
            ).then((response) => {
                response.json().then((data: Data) => {
                    console.log(data);

                    setData(data);
                });
            });
        }
    }, [uid]);

    return <Layout>yuh</Layout>;
};

export default Solve;
