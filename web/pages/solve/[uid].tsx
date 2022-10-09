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
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { BsArrowLeft, BsShareFill, BsTwitter, BsXLg } from "react-icons/bs";
import { MdOutlineContentCopy } from "react-icons/md";
import { Box as CustomBox } from "../../Classes/Box";
import { Point } from "../../Classes/Point";
import { Layout } from "../../components/Layout";
import { cleanString } from "../../utils/cleanString";
import { errorAnim } from "../../utils/errorAnim";

type Data = {
    uid: number;
    url: string;
    croppedInput: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    };
    grid: typeof CustomBox[][];
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

    const toast = useToast();
    const wordInputRef = useRef<HTMLInputElement>(null);
    const [isMobile] = useMediaQuery("(max-width: 768px)");
    const gridImageCanvas = useRef<HTMLCanvasElement>(null); // cropped grid image, no drawing on it (needed for redrawing the found words)
    const canvasRef = useRef<HTMLCanvasElement>(null); // grid image with lines and boxes on it

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
        // if (!debugCanvasRef.current || !tempCanvasRef.current) return;

        // const found = solveWordSearch(
        //     debugCanvasRef.current,
        //     tempCanvasRef.current,
        //     grid,
        //     newWords ? newWords : words
        // );
        // setFound(found);

        if (newWords) setWords(newWords);
    };

    useEffect(() => {
        if (!data) return;

        const img = new Image();

        // img.src = data.url;
        // access public folder to get testsearch.png and create a blob url for img.src
        fetch("/testsearch.png")
            .then((res) => res.blob())
            .then((blob) => {
                img.src = URL.createObjectURL(blob);
            });

        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            // FUTURE KYLE
            // cropping image not working
            // either coordinates aren't good or transforming the image wrong

            // need to resize the canvas so that the coordinates match up with how the models are processing the image
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

            const test = document.getElementById("test");
            while (test?.firstChild) {
                test.removeChild(test.firstChild);
            }
            document.getElementById("test")?.appendChild(canvas);

            const p1 = new Point(data.croppedInput.x1, data.croppedInput.y1);
            p1.draw(ctx, "blue");

            const p2 = new Point(data.croppedInput.x2, data.croppedInput.y2);
            p2.draw(ctx, "blue");

            const cropped = ctx.getImageData(
                data.croppedInput.x1,
                data.croppedInput.y1,
                data.croppedInput.x2 - data.croppedInput.x1,
                data.croppedInput.y2 - data.croppedInput.y1
            );

            if (!gridImageCanvas.current) return;
            const gridImage = gridImageCanvas.current;
            gridImage.width = cropped.width;
            gridImage.height = cropped.height;

            const gridImageCtx = gridImage.getContext("2d");
            if (!gridImageCtx) return;
            gridImageCtx.putImageData(cropped, 0, 0);
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

    return (
        <Layout>
            <div id="test"></div>
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
                        ref={gridImageCanvas}
                        style={{
                            // display: "none"
                            width: 500,
                            height: 500,
                        }}
                    />
                    <canvas
                        style={{
                            backgroundColor: "grey",
                            borderRadius: 6,
                            width: "896px",
                            height: "896px",
                        }}
                        ref={canvasRef}
                    />
                </Box>

                {!isMobile && <Box mr={2} />}

                <Flex direction="column" mt={isMobile ? 2 : 0}>
                    <Flex>
                        <Flex direction="column" mr={2}>
                            {/* add some glow to this later to make it more obvious */}
                            <Input
                                ref={wordInputRef}
                                animation={wordError ? errorAnim : ""}
                                placeholder="Add a word!"
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
                    <br />
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
                </Flex>
            </Flex>
            <Text mt={2}>
                <b>
                    Not working? Try tapping on a letter to change its contents!
                </b>
            </Text>
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
        console.log(params.uid);

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
