import {
    Box,
    Button,
    Flex,
    IconButton,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Text,
    useDisclosure,
    useMediaQuery,
    useToast,
} from "@chakra-ui/react";
import { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { BsArrowLeft, BsShareFill, BsTwitter, BsXLg } from "react-icons/bs";
import { MdOutlineContentCopy } from "react-icons/md";
import { Box as CustomBox } from "../../Classes/Box";
import { Point } from "../../Classes/Point";
import { Layout } from "../../components/Layout";
import { cleanString } from "../../utils/cleanString";
import { drawBoxes } from "../../utils/drawBoxes";
import { errorAnim } from "../../utils/errorAnim";
import { solveWordSearch } from "../../utils/solveWordSearch";

type Data = {
    uid: number;
    url: string;
    croppedInput: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    };
    grid: CustomBox[][];
    createdOn: number;

    error?: any; // yup validation error
};

const Solve: InferGetStaticPropsType<typeof getStaticProps> = ({
    uid,
    data,
}: {
    uid: number | undefined;
    data: Data | undefined;
}) => {
    const router = useRouter();

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [words, setWords] = useState<string[]>([]);
    const [found, setFound] = useState<Set<string>>(new Set<string>()); // solveWordSearch(): cleaned input words
    const [wordError, setWordError] = useState<string | null>(null);
    const [grid, setGrid] = useState<CustomBox[][]>([]);

    const toast = useToast();
    const wordInputRef = useRef<HTMLInputElement>(null);
    const [isMobile] = useMediaQuery("(max-width: 768px)");
    const gridImageCanvas = useRef<HTMLCanvasElement>(null); // cropped grid image, no drawing on it (needed for redrawing the found words)
    const wsCanvas = useRef<HTMLCanvasElement>(null); // grid image with lines and boxes on it

    const insertWord = (word: string) => {
        if (words.length >= 100) {
            setWordError("Max of 100 words!");
            return;
        }

        // word is empty or only consists of spaces return false
        if (word.length === 0 || word.trim().length === 0) {
            setWordError("Cannot add nothing!");
            return false;
        }

        // make sure it's not a duplicate
        const cleanedWords: string[] = [];
        words.forEach((w) => {
            const clean = cleanString(w);
            cleanedWords.push(clean);
        });

        const cleanedWord = cleanString(word);
        if (cleanedWords.indexOf(cleanedWord) !== -1) {
            setWordError("Word already exists");
            return false;
        } else {
            setWordError(null);
            resolveWordsearch([...words, word]);
            return true;
        }
    };

    // handles adding the found words and updating the state
    // need to pass in updated words array bc react doesn't rerender the canvas after an update to the state
    const resolveWordsearch = (newWords?: string[]) => {
        if (!wsCanvas.current || !gridImageCanvas.current) return;

        const found = solveWordSearch(
            wsCanvas.current,
            gridImageCanvas.current,
            grid,
            newWords ? newWords : words
        );
        setFound(found);

        if (newWords) setWords(newWords);
    };

    useEffect(() => {
        if (!data) return;
        console.log(data);

        // need to recreate the grid from the data bc grid contains just raw data and doesn't have the special helper classes
        const newGrid = data.grid.map((row) => {
            return row.map((box) => {
                return new CustomBox(
                    box.klass,
                    box.topLeft,
                    box.bottomRight,
                    box.id,
                    box.score
                );
            });
        });
        setGrid(newGrid);

        // load the image
        const img = new Image();
        img.src = data.url;

        img.onload = () => {
            // resize image and crop according to coordinates from model
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.fillStyle = "#000000";
            const identiferRes = 800; // resolution of the input image for the identifier model
            canvas.width = identiferRes;
            canvas.height = identiferRes;

            ctx.fillRect(0, 0, identiferRes, identiferRes);
            const ratio = Math.min(
                identiferRes / img.naturalWidth,
                identiferRes / img.naturalHeight
            );
            const newWidth = Math.round(img.naturalWidth * ratio);
            const newHeight = Math.round(img.naturalHeight * ratio);

            ctx.drawImage(
                img,
                0,
                0,
                img.naturalWidth,
                img.naturalHeight,
                (identiferRes - newWidth) / 2,
                (identiferRes - newHeight) / 2,
                newWidth,
                newHeight
            );

            const box = new CustomBox(
                "",
                new Point(data.croppedInput.x1, data.croppedInput.y1),
                new Point(data.croppedInput.x2, data.croppedInput.y2)
            );
            box.convertFromYolo(identiferRes, identiferRes);

            if (!gridImageCanvas.current || !wsCanvas.current) return;
            const gridImage = gridImageCanvas.current;
            const ws = wsCanvas.current;

            const cropAndResize = document.createElement("canvas");
            cropAndResize.width = ws.width;
            cropAndResize.height = ws.height;
            cropAndResize
                .getContext("2d")
                ?.drawImage(
                    canvas,
                    box.topLeft.x,
                    box.topLeft.y,
                    box.width,
                    box.height,
                    0,
                    0,
                    ws.width,
                    ws.height
                );

            const gridImageCtx = gridImage.getContext("2d");
            const wsCanvasCtx = ws.getContext("2d");
            if (!gridImageCtx || !wsCanvasCtx) return;
            gridImageCtx.drawImage(cropAndResize, 0, 0);
            wsCanvasCtx.drawImage(cropAndResize, 0, 0);

            // FUTURE KYLE
            // drawBoxes requires rerender of canvas to update what's on it
            // create dynamic seo tags based on data inside of getStaticProps?

            drawBoxes(ws, grid);
        };
    }, [data]);

    if (router.isFallback)
        return (
            <Layout>
                <div>Loading...</div>
                <Spinner mt={2} size="xl" />
            </Layout>
        );

    if (!data) {
        return (
            <Layout>
                <Text>There's nothing for this id wot</Text>
            </Layout>
        );
    }

    const url = process.env.NEXT_PUBLIC_URL + `/solve/${uid}`;
    const title = "Wordsearcher";
    const description =
        "This word search was solved with Wordsearcher! (/≧▽≦)/";

    return (
        <Layout>
            <Head>
                <title>{title + " - " + data.uid}</title>
                <meta name="title" content={title} />
                <meta name="description" content={description} />
                <meta name="copyright" content="Kyle Yu" />
                <meta
                    name="keywords"
                    content="wordsearcher,word search,solve"
                />
                <meta name="theme-color" content="#FF9A00" />
                <link rel="icon" href="/favicon.ico" />

                <meta property="og:type" content="website" />
                <meta property="og:url" content={url} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                <meta property="og:image" content={data.url} />

                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content={url} />
                <meta property="twitter:title" content="Wordsearcher" />
                <meta property="twitter:description" content={description} />
                <meta property="twitter:image" content={data.url} />
            </Head>
            <canvas
                ref={gridImageCanvas}
                width={896}
                height={896}
                style={{
                    display: "none",
                }}
            />
            <Flex mb={2}>
                <Button
                    mr={2}
                    leftIcon={<BsArrowLeft title="ooga booga" />}
                    onClick={() => router.push("/")}
                    variant="primary"
                >
                    Go back
                </Button>
                <Button
                    leftIcon={<BsShareFill title="Share this solve" />}
                    onClick={onOpen}
                    variant="primary"
                >
                    Share
                </Button>
                <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Share</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Flex align="center">
                                <Input mr={2} value={url} readOnly />
                                <Button
                                    leftIcon={
                                        <MdOutlineContentCopy title="Copy link" />
                                    }
                                    variant="primary"
                                    onClick={() => {
                                        navigator.clipboard.writeText(url);
                                        toast({
                                            title: "Copied to clipboard",
                                            position: "top",
                                            isClosable: true,
                                            duration: 2000,
                                        });
                                    }}
                                >
                                    Copy
                                </Button>
                            </Flex>
                            <Button
                                mt={2}
                                colorScheme="twitter"
                                leftIcon={<BsTwitter title="Tweet this" />}
                                onClick={() => {
                                    window.open(
                                        `https://twitter.com/intent/tweet?url=${url}&text=I%20just%20solved%20a%20wordsearch%20on%20Wordsearcher!%20Check%20it%20out:&hashtags=Wordsearcher%2Cwordsearch`,
                                        "_blank"
                                    );
                                }}
                            >
                                Tweet
                            </Button>
                            <Text mt={2}>
                                Any exposure is greatly appreciated, thx :3
                            </Text>
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </Flex>
            <Flex
                wrap={isMobile ? "wrap" : "nowrap"}
                justifyContent={isMobile ? "center" : ""}
            >
                <Box>
                    <canvas
                        style={{
                            backgroundColor: "grey",
                            borderRadius: 6,
                        }}
                        ref={wsCanvas}
                        width={896}
                        height={896}
                    />
                </Box>

                {!isMobile && <Box mr={2} />}

                <Flex direction="column" mt={isMobile ? 2 : 0}>
                    {words.map((w, i) => (
                        <Flex key={i} align="center">
                            {/* individual word display */}
                            <Input
                                type="text"
                                value={w}
                                mt={1}
                                mr={2}
                                backgroundColor={
                                    !found.has(cleanString(w)) ? "red.400" : ""
                                }
                                onChange={(e) => {
                                    // pretty sure there's a cool react way that doesn't involve me copying the array over but wutever
                                    let copy = words.slice(0);
                                    if (e.currentTarget.value.length == 0) {
                                        copy = copy.filter((_, j) => i !== j);
                                    } else {
                                        copy[i] = e.currentTarget.value;
                                    }
                                    resolveWordsearch(copy);
                                }}
                            />
                            {/* delete word */}
                            <IconButton
                                icon={<BsXLg />}
                                aria-label="Delete word"
                                onClick={() => {
                                    resolveWordsearch(
                                        words.filter((_, j) => i !== j)
                                    );
                                }}
                            />
                        </Flex>
                    ))}
                    <br />
                    <Flex>
                        <Flex direction="column" mr={2}>
                            {/* add some glow to this later to make it more obvious */}
                            <Input
                                ref={wordInputRef}
                                animation={wordError ? errorAnim : ""}
                                placeholder="Add a word!"
                                onBlur={(e) => {
                                    if (e.currentTarget.value.length == 0)
                                        return;
                                    if (insertWord(e.currentTarget.value)) {
                                        e.currentTarget.value = "";
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        if (insertWord(e.currentTarget.value)) {
                                            e.currentTarget.value = "";
                                        }
                                    }
                                }}
                            />
                            {wordError && (
                                <Text align="left" size="sm" color="red">
                                    {wordError}
                                </Text>
                            )}
                        </Flex>
                        <Button
                            variant="primary"
                            onClick={(e) => {
                                if (!wordInputRef.current) return;

                                var value = wordInputRef.current.value;
                                if (insertWord(value)) {
                                    value = "";
                                }
                            }}
                        >
                            Add
                        </Button>
                    </Flex>
                </Flex>
            </Flex>
            {/* <Text mt={2}>
                <b>
                    Not working? Try tapping on a letter to change its contents!
                </b>
            </Text> */}
        </Layout>
    );
};

// ig this is run while building the page, don't know why have to pass in random thing for params tho
export async function getStaticPaths() {
    return {
        paths: [{ params: { uid: "asdf" } }],
        fallback: true,
    };
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
    var data: Data | null = null;

    if (params?.uid) {
        const response = await fetch(
            `https://wordsearcher.azurewebsites.net/api/getSolve?uid=${params.uid}`
        );
        data = await response.json();

        if (data?.error) {
            data = null;
        }
    }

    return {
        props: {
            data,
            uid: params?.uid,
        },
    };
};
export default Solve;
