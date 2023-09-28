import {
  Box,
  Button,
  Image as ChakraImage,
  Checkbox,
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
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import {
  BsArrowLeft,
  BsPlusLg,
  BsShareFill,
  BsTwitter,
  BsXLg,
} from "react-icons/bs";
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
  //   croppedInput: {
  //     x1: number;
  //     y1: number;
  //     x2: number;
  //     y2: number;
  //   };
  //   grid: CustomBox[][];

  // stringified with JSON.stringify bc firebase only accepts primitive data types and not complex objects
  croppedInput: string;
  grid: string;
  createdAt: number;

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

  const {
    isOpen: shareIsOpen,
    onOpen: shareOnOpen,
    onClose: shareOnClose,
  } = useDisclosure();
  const [words, setWords] = useState<string[]>([]);
  const [found, setFound] = useState<Set<string>>(new Set<string>()); // solveWordSearch(): cleaned input words
  const [wordError, setWordError] = useState<string | null>(null);
  const [grid, setGrid] = useState<CustomBox[][]>([]);
  const [drawLetters, setDrawLetters] = useState(false);
  const [showOgImg, setShowOgImg] = useState(false);

  const toast = useToast();
  const wordInputRef = useRef<HTMLInputElement>(null);
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const gridImageCanvas = useRef<HTMLCanvasElement>(null); // cropped grid image, no drawing on it (needed for redrawing the found words)
  const wsCanvas = useRef<HTMLCanvasElement>(null); // grid image with lines and boxes on it

  const insertWord = (word: string) => {
    if (words.length >= 100) {
      setWordError("Max of 100 words!");
      return false;
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
    if (drawLetters) {
      drawBoxes(wsCanvas.current, grid);
    }
    setFound(found);

    if (newWords) setWords(newWords);
  };

  useEffect(() => {
    if (!data) return;
    const grid: CustomBox[][] = JSON.parse(data.grid);
    const croppedInput: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    } = JSON.parse(data.croppedInput);

    // need to recreate the grid from the data bc grid contains just raw data and doesn't have the special helper classes
    const newGrid = grid.map((row) => {
      return row.map((box: CustomBox | null) => {
        return new CustomBox(
          box?.klass ? box.klass : "",
          box?.topLeft ? box.topLeft : new Point(0, 0),
          box?.bottomRight ? box.bottomRight : new Point(0, 0),
          box?.id,
          box?.score
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
        new Point(croppedInput.x1, croppedInput.y1),
        new Point(croppedInput.x2, croppedInput.y2)
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

      drawBoxes(wsCanvas.current, newGrid);
    };
  }, [data]);

  if (router.isFallback)
    return (
      <Layout>
        <div>Loading...</div>
        <div>(Have to wake up the server, so it might take a few seconds)</div>
        <Spinner mt={2} size="xl" />
      </Layout>
    );

  if (!data) {
    return (
      <Layout>
        <Text>There&apos;s nothing for this id wot</Text>
      </Layout>
    );
  }

  const url = process.env.NEXT_PUBLIC_URL + `/solve/${uid}`;
  const title = "Wordsearcher";
  const description = "This word search was solved with Wordsearcher! (/≧▽≦)/";

  return (
    <Layout>
      <Head>
        <title>{title + " | Solve"}</title>
        <meta name="title" content={title} />
        <meta name="description" content={description} />
        <meta name="copyright" content="Kyle Yu" />
        <meta name="keywords" content="wordsearcher,word search,solve" />
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
      {/* contains the cropped, clean image for use in rerendering the wordsearch */}
      <canvas
        ref={gridImageCanvas}
        width={896}
        height={896}
        style={{
          display: "none",
        }}
      />
      <Flex mb={2}>
        <Link href="/" passHref>
          <Button
            mr={2}
            leftIcon={<BsArrowLeft title="ooga booga" />}
            variant="primary"
          >
            Go back
          </Button>
        </Link>
        <Button
          leftIcon={<BsShareFill title="Share this solve" />}
          onClick={shareOnOpen}
          bgColor="orange.600"
        >
          Share
        </Button>
        <Modal size="lg" isOpen={shareIsOpen} onClose={shareOnClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Share</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Flex align="center">
                <Input mr={2} value={url} readOnly />
                <Button
                  leftIcon={<MdOutlineContentCopy title="Copy link" />}
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
              <Text mt={2}>Any exposure is greatly appreciated, thx :3</Text>
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
              maxWidth: "85vw",
              maxHeight: "80vh",
              display: showOgImg ? "none" : "block",
            }}
            ref={wsCanvas}
            width={896}
            height={896}
          />
          <ChakraImage
            src={data.url}
            maxWidth="85vw"
            maxHeight="80vh"
            display={showOgImg ? "block" : "none"}
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
                backgroundColor={!found.has(cleanString(w)) ? "red.400" : ""}
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
                icon={<BsXLg title="Delete this word" />}
                aria-label={"Delete word: " + w}
                onClick={() => {
                  resolveWordsearch(words.filter((_, j) => i !== j));
                }}
              />
            </Flex>
          ))}
          {words.length > 0 && <br />}
          <Flex>
            <Flex direction="column" mr={2}>
              {/* add some glow to this later to make it more obvious */}
              <Input
                ref={wordInputRef}
                animation={wordError ? errorAnim : ""}
                placeholder="Add a word!"
                onBlur={(e) => {
                  if (e.currentTarget.value.length == 0) return;
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
            <IconButton
              icon={<BsPlusLg title="Add word" />}
              aria-label="Add word"
              variant="primary"
              onClick={(e) => {
                if (!wordInputRef.current) return;

                var value = wordInputRef.current.value;
                if (insertWord(value)) {
                  value = "";
                }
              }}
            />
          </Flex>
        </Flex>
      </Flex>

      <Text mt={2}>
        <Checkbox
          size="lg"
          colorScheme="orange"
          isChecked={showOgImg}
          mr={2}
          onChange={(e) => {
            setShowOgImg(e.currentTarget.checked);
          }}
        >
          Show original image
        </Checkbox>

        <Checkbox
          size="lg"
          colorScheme="orange"
          isChecked={drawLetters}
          onChange={(e) => {
            if (!wsCanvas.current || !gridImageCanvas.current) return;

            if (e.target.checked) {
              drawBoxes(wsCanvas.current, grid);
            } else {
              solveWordSearch(
                wsCanvas.current,
                gridImageCanvas.current,
                grid,
                words
              );
            }
            setDrawLetters(e.target.checked);
          }}
        >
          Draw letters
        </Checkbox>
        {/* <b>
                    Not working? Try tapping on a letter to change its contents!
                </b> */}
      </Text>
    </Layout>
  );
};

// ig this is run while building the page, don't know why have to pass in random thing for params tho
export async function getStaticPaths() {
  return {
    paths: [{ params: { uid: "iapvQVYNJteS8OCaGl0a" } }],
    fallback: true,
  };
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  var data: Data | null = null;

  if (params?.uid) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/getSolve?uid=${params.uid}`
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
