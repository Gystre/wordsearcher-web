import {
  Box,
  Button,
  ColorModeScript,
  Flex,
  Heading,
  Icon,
  Input,
  Spinner,
  Text,
  useColorMode,
  useMediaQuery,
  useToast,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { createRef, useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { BsFillImageFill } from "react-icons/bs";
import ReactTyped from "react-typed";
import { ExampleBox } from "../components/ExampleBox";
import { Layout } from "../components/Layout";
import { ErrorCode } from "../utils/ErrorCode";
import { errorAnim } from "../utils/errorAnim";
import theme from "../utils/theme";
import { uploadToB2 } from "../utils/uploadToB2";
import { validateUrl } from "../utils/validateUrl";

// max size of uploaded image in mb
const maxSize = 15;

const firstText = ["Solve any wordsearch with just a picture!"];
const otherText = [
  "Upload a picture of a wordsearch and get the solution!",
  "Get the solution by uploading a picture!",
  "With just a picture you can solve any wordsearch!",
  "Picture for da wordsearch",
  "Solve wordsearches or smthn",
  "lol idk",
  "⭐ たんたかたん～ ⭐",
  "急いで、これを使いなさい！",
  "AAAAAAAAAAAHHHHHHHHHHHHHHHHHHHHHHHHHHHHH",
  "NOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "Uh yeah!",
  "( ´･･)ﾉ(._.`)",
  "ballin",
  "Kyle cool?",
  "Kyle cool everyday.",
  "Better than Paulo!",
  "Way better than squishy!",
  "yessir",
  "No, that wasn't quite right...",
  "Why are you still sitting there reading these?!",
  "Upload a file already!",
  "ヾ(≧へ≦)〃",
  "Stop reading and use the tool already!!!!",
  "",
  "What do you think you're doing...",
  "B-baka! (*/ω＼)",
  "Hmph! (︶︹︺)",
  "(＾• ω •＾)",
  "I'M DROWNING AAGHATPHTHGHTATHGPAHTGPHATG ‿︵‿︵‿︵‿ヽ(°□° )ノ︵‿︵‿︵‿︵",
  "Keep your back straight! (￣ー￣)",
  "Stay hydrated! 💧🍼",
  "Don't forget to eat! 🍔🍟",
  "Stay alive! 🧠",
  "Don't die! 💀",
  "ඞ🔪ඞ",
];

const Home: NextPage = () => {
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const { colorMode } = useColorMode();
  const toast = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState("");
  const [currentText, setCurrentText] = useState(firstText);

  const errorToast = (err: string) => {
    toast({
      title: "Error",
      description: err,
      status: "error",
      duration: 5000,
      isClosable: true,
      position: "top",
    });
  };

  const setCrashed = () => {
    setLoading(false);
    setError(true);
  };

  const formik = useFormik({
    initialValues: {
      file: null as File | null,
      url: "",
    },
    onSubmit: async (values) => {
      setStatus("Uploading...");
      setError(false);
      setLoading(true);
      var url = "";

      try {
        if (values.file) {
          url = await uploadToB2(values.file);
          console.log(url);
        } else if (values.url.length > 0) {
          if (!validateUrl(values.url)) {
            errorToast("Invalid URL");
            setCrashed();
            return;
          }

          const uploadResponse = await fetch("/api/uploadB2", {
            method: "POST",
            body: JSON.stringify({ url: values.url }),
          });

          if (uploadResponse.status == 200) {
            const data = await uploadResponse.json();

            if (data.error) {
              if (data.error == ErrorCode.invalidUrl) {
                errorToast("Invalid URL");
              } else if (data.error == ErrorCode.imageTooBig) {
                errorToast("Image is bigger than " + maxSize + "mb");
              } else if (data.error == ErrorCode.invalidImage) {
                errorToast("Invalid Image: URL does not lead to an image");
              } else if (data.error == ErrorCode.b2UploadUrlFailed) {
                errorToast("Failed to get upload URL from B2");
              } else if (data.error == ErrorCode.b2UploadFailed) {
                errorToast(
                  "Failed to upload to B2. I might have deleted the upload bucket or smthn"
                );
              }

              setCrashed();
              return;
            }
            url = data.url;
          }
          if (uploadResponse.status == 500) {
            errorToast("Unhandled error. For the developer check the console");
            console.log(await uploadResponse.text());
            setCrashed();
            return;
          }
        }
      } catch (e: any) {
        errorToast(e.message);
        setCrashed();
        return;
      }

      setStatus("Uploaded file...");

      if (url.length > 0) {
        console.log("url:", url);
        setStatus("Identifying wordsearch...");

        // for the vercel version of identifySearch
        // var response = await fetch(`/api/identifySearch`, {
        //   method: "POST",
        //   body: JSON.stringify({ url }),
        // });
        var response = await fetch(
          `https://wordsearcher.azurewebsites.net/api/identifysearch?url=${url}`
        );
        if (!response.ok) {
          errorToast(
            "Failed to connect to server. It might be down right now :("
          );
          console.log(await response.text());

          setCrashed();
          return;
        }

        var data = await response.json();
        if (typeof data.error === "number") {
          try {
            switch (data.error) {
              case ErrorCode.invalidUrl:
                throw new Error("Invalid image link.");
              case ErrorCode.modelNotLoaded:
                // try again 3 times each 3 seconds apart
                var got = false;
                for (let i = 1; i <= 3; i++) {
                  setStatus("Models aren't loaded, attempt: " + i + "...");
                  await new Promise((r) => setTimeout(r, 3000));
                  // await fetch(`/api/identifySearch`, {
                  //   method: "POST",
                  //   body: JSON.stringify({ url }),
                  // })
                  await fetch(
                    `https://wordsearcher.azurewebsites.net/api/identifysearch?url=${url}`
                  )
                    .then((response) => {
                      if (response.ok) {
                        return response.json();
                      }
                      throw new Error("");
                    })
                    .then((newData) => {
                      if (!newData.error) {
                        data = newData;
                        got = true;
                      }
                    })
                    .catch((e) => {});

                  if (got) break;
                }
                if (!got)
                  throw new Error(
                    "The models aren't loaded. Please try again in ~5 seconds."
                  );
                break;
              case ErrorCode.wordsearchNotFound:
                throw new Error(
                  "No wordsearch found in the image. Please try using a different picture or use better lighting."
                );
            }
          } catch (e: any) {
            errorToast(e.message);
            setCrashed();
            return;
          }
        }

        setStatus("Working...");

        const finalData = {
          url,
          ...data,
        };

        // insert into db and redirect
        var dbResponse = await fetch("/api/insertSolve", {
          method: "POST",
          body: JSON.stringify(finalData),
        });

        if (!dbResponse.ok) {
          console.log(await dbResponse.text());

          errorToast("Failed to insert into the database. Please try again.");
          setCrashed();
        }

        var dbData = await dbResponse.json();
        if (dbData.error) {
          errorToast(
            "The developer is missing the credentials to the database so nothing will work. Please try again later."
          );
          setCrashed();
          return;
        }

        setStatus("Solved! Going to word search page...");
        router.push(`/solve/${dbData.id}`);
      }
    },
  });

  const dropzoneRef = createRef<HTMLInputElement>();
  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const error = fileRejections[0]?.errors[0]?.code;
      if (fileRejections.length > 0) {
        if (error === "file-invalid-type") {
          errorToast("This file is not an image! ╰（‵□′）╯");
        } else if (error === "file-too-large") {
          errorToast("Image is bigger than " + maxSize + "mb! (* ￣︿￣)");
        }
        setCrashed();
        return;
      }

      formik.setFieldValue("file", acceptedFiles[0]);
      formik.submitForm();
    },
    [formik]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    accept: { "image/*": [] },
    maxSize: maxSize * 1024 * 1024,
  });

  var display: any = null;
  if (isDragActive) {
    display = <Text>Drop an image</Text>;
  } else {
    if (!loading) {
      display = (
        <>
          <Flex align="center">
            <Icon as={BsFillImageFill} width="30px" height="30px" mr={2} />
            <div>
              Drag an image or{" "}
              <Box
                display="inline"
                textDecoration="underline"
                cursor="pointer"
                color="blue.300"
                onClick={() => dropzoneRef.current?.click()}
              >
                upload a file
              </Box>
            </div>
          </Flex>
          <Text>OR</Text>
          <Flex>
            <Input
              mr={2}
              placeholder="Enter an image link here!"
              onChange={formik.handleChange}
              value={formik.values.url}
              name="url"
            />
            <Button
              variant="primary"
              type="submit"
              disabled={
                formik.values.url.length === 0 ||
                formik.values.url.length > 1000
              }
            >
              Upload
            </Button>
          </Flex>
        </>
      );
    } else {
      display = (
        <Flex align="center" direction="column">
          <Spinner />
          <Text mt={2}>{status}</Text>
        </Flex>
      );
    }
  }

  const description =
    "Have a word search you don't feel like solving? Solve it in Wordsearcher with just a picture! (^・ω・^ )";
  const imageUrl = "https://gystre.github.io/assets/wordsearcher_seo.png";

  return (
    <Layout>
      <Head>
        <title>Wordsearcher</title>
        <meta name="title" content="Wordsearcher" />
        <meta name="description" content={description} />
        <meta name="keywords" content="wordsearcher,word search,solve" />
        <meta name="theme-color" content="#FF9A00" />
        <link rel="icon" href="/favicon.ico" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://wordsearcher.kyleyu.org" />
        <meta property="og:title" content="Wordsearcher" />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={imageUrl} />

        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content="https://wordsearcher.kyleyu.org"
        />
        <meta property="twitter:title" content="Wordsearcher" />
        <meta property="twitter:description" content={description} />
        <meta property="twitter:image" content={imageUrl} />
      </Head>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />

      {/*
            FUTURE KYLE
            still won't load on my phone
            try to find an in html console to debug on phone
            eruda is one but doesn't work with react
            might have to make issue on chakra github

            also maybe bring back the column layout for the example boxes, need to see how it'll look like on my phone first
            */}

      <Heading mb={2}>
        <ReactTyped
          strings={currentText}
          onLastStringBackspaced={() => {
            if (currentText === firstText) setCurrentText(otherText);
          }}
          backDelay={currentText === firstText ? 8000 : 2000}
          startDelay={1000} // bug: only affects first time, other strings in the array will start immediately
          typeSpeed={30}
          backSpeed={60}
          loop
          shuffle
        />
      </Heading>
      <form onSubmit={formik.handleSubmit}>
        <div {...getRootProps()}>
          <Flex
            margin={2}
            padding={2}
            border="dashed 2px"
            borderColor={error ? "red" : "gray.300"}
            borderRadius={6}
            backgroundColor={colorMode === "light" ? "gray.50" : "gray.700"}
            minWidth={isMobile ? "60vw" : "500px"}
            height="300px"
            direction="column"
            align="center"
            justifyContent="space-evenly"
            basis="100%"
            // as={motion.div}
            animation={error ? errorAnim : ""}
          >
            <input {...getInputProps()} ref={dropzoneRef} />
            {display}
          </Flex>
        </div>
      </form>
      <Box mb={8} />

      <Heading size="lg" mt={2} mb={4}>
        Or try one of these...
      </Heading>
      <Flex>
        <ExampleBox href="/solve/mRZNA0W0mKpl6ue1Kpwz" imageUrl="/ex1.jpg" />
        <ExampleBox href="/solve/nQLVQH1ho3dIvd5kw6r2" imageUrl="/ex2.jpg" />
        <ExampleBox href="/solve/vTZirm3qjSx8hG5Ggceb" imageUrl="/ex3.jpg" />
      </Flex>
    </Layout>
  );
};

export default Home;
