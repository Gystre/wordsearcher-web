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
import { motion } from "framer-motion";
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { createRef, useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { BsFillImageFill } from "react-icons/bs";
import { ExampleBox } from "../components/ExampleBox";
import { Layout } from "../components/Layout";
import theme from "../theme";
import { errorAnim } from "../utils/errorAnim";
import { ErrorCode } from "../utils/ErrorCode";
import { uploadToB2 } from "../utils/uploadToB2";

const Home: NextPage = () => {
    const [isMobile] = useMediaQuery("(max-width: 768px)");
    const { colorMode } = useColorMode();
    const toast = useToast();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState("");

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
                } else if (values.url.length > 0) {
                    // this is a little overengineered but wutever
                    const fileNameMaybeExtension = values.url.split("/").pop();
                    const extension = fileNameMaybeExtension?.split(".").pop();
                    const hasExtension = extension != fileNameMaybeExtension;
                    var fileName = "";
                    if (hasExtension) {
                        // the file is guaranteed to have an extension here since the extension variable exists
                        fileName = fileNameMaybeExtension as string;
                    } else {
                        fileName = fileNameMaybeExtension + ".png";
                    }

                    // download image url into a file object
                    const file = await fetch(values.url)
                        .then((r) => r.blob())
                        .then(
                            (blobFile) =>
                                new File([blobFile], fileName, {
                                    type: hasExtension
                                        ? `image/${extension}`
                                        : "image/png",
                                })
                        );

                    url = await uploadToB2(file);
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

                var response = await fetch(
                    `https://wordsearcher.azurewebsites.net/api/identifysearch?url=${url}`
                );
                if (!response.ok) {
                    errorToast(
                        "Failed to connect to server. It might be down right now :("
                    );
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
                                    setStatus(
                                        "Models aren't loaded, attempt: " +
                                            i +
                                            "..."
                                    );
                                    await new Promise((r) =>
                                        setTimeout(r, 3000)
                                    );
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
                                        "Model not loaded, the azure function is probably asleep. Please try again in ~5 seconds."
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
                var dbResponse = await fetch(
                    "https://wordsearcher.azurewebsites.net/api/insertSolve",
                    {
                        method: "POST",
                        body: JSON.stringify(finalData),
                    }
                );

                // try it again 3 more times cuz gives 500 error sometimes???
                if (!dbResponse.ok) {
                    var got = false;
                    for (let i = 1; i <= 3; i++) {
                        setStatus(
                            "Failed to insert into database, attempt: " +
                                i +
                                "..."
                        );
                        await new Promise((r) => setTimeout(r, 3000));
                        dbResponse = await fetch(
                            "https://wordsearcher.azurewebsites.net/api/insertSolve",
                            {
                                method: "POST",
                                body: JSON.stringify(finalData),
                            }
                        );
                        if (dbResponse.ok) {
                            got = true;
                            break;
                        }
                    }

                    if (!got) {
                        errorToast(
                            "Failed to insert into the database. Please try again."
                        );
                        setCrashed();
                        return;
                    }
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
                router.push(`/solve/${dbData.uid}`);
            }
        },
    });

    const maxSize = 15; // 15mb
    const dropzoneRef = createRef<HTMLInputElement>();
    const onDrop = useCallback(
        (acceptedFiles: File[], fileRejections: FileRejection[]) => {
            const error = fileRejections[0]?.errors[0]?.code;
            if (fileRejections.length > 0) {
                if (error === "file-invalid-type") {
                    errorToast("This file is not an image! ╰（‵□′）╯");
                } else if (error === "file-too-large") {
                    errorToast(
                        "Image is bigger than " + maxSize + "mb! (* ￣︿￣)"
                    );
                }
                setCrashed();
                return;
            }

            formik.setFieldValue("file", acceptedFiles[0]);
            formik.submitForm();
        },
        []
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
                        <Icon
                            as={BsFillImageFill}
                            width="30px"
                            height="30px"
                            mr={2}
                        />
                        <div>
                            Drag an image{" "}
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
                            placeholder="URL"
                            onChange={formik.handleChange}
                            value={formik.values.url}
                            name="url"
                        />
                        <Button variant="primary" type="submit">
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

    return (
        <Layout>
            <Head>
                <title>Wordsearcher</title>
                <meta name="title" content="Wordsearcher" />

                <meta
                    name="description"
                    content="Have a word search you don't feel like solving? Solve it in Wordsearcher with just a picture!"
                />

                <meta name="copyright" content="Kyle Yu" />

                <meta
                    name="keywords"
                    content="wordsearcher,word search,solve"
                />

                <meta property="og:type" content="website" />

                <meta name="theme-color" content="#FF9A00" />

                <meta
                    property="og:url"
                    content="https://wordsearcher.kyleyu.org"
                />

                <meta property="og:title" content="Wordsearcher" />

                <meta
                    property="og:description"
                    content="Have a word search you don't feel like solving? Solve it in Wordsearcher with just a picture!"
                />

                <meta
                    property="og:image"
                    content="https://cdn.discordapp.com/attachments/200994742782132224/1029618061029941258/wordsearcher_preview_image.png"
                />

                <meta property="twitter:card" content="summary_large_image" />

                <meta
                    property="twitter:url"
                    content="https://wordsearcher.kyleyu.org"
                />

                <meta property="twitter:title" content="Wordsearcher" />

                <meta
                    property="twitter:description"
                    content="Have a word search you don't feel like solving? Solve it in Wordsearcher with just a picture!"
                />

                <meta
                    property="twitter:image"
                    content="https://cdn.discordapp.com/attachments/200994742782132224/1029618061029941258/wordsearcher_preview_image.png"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div id="test"></div>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <Heading mb={2}>Solve any wordsearch with just a picture!</Heading>
            <form onSubmit={formik.handleSubmit}>
                <div {...getRootProps()}>
                    <Flex
                        margin={2}
                        padding={2}
                        border="dashed 2px"
                        borderColor={error ? "red" : "gray.300"}
                        borderRadius={6}
                        backgroundColor={
                            colorMode === "light" ? "gray.50" : "gray.700"
                        }
                        minWidth={isMobile ? "60vw" : "500px"}
                        height="300px"
                        direction="column"
                        align="center"
                        justifyContent="space-evenly"
                        basis="100%"
                        as={motion.div}
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
            <Flex direction={isMobile ? "column" : "row"}>
                <ExampleBox imageUrl="/ex1.jpg" />
                <ExampleBox imageUrl="/ex1.jpg" />
                <ExampleBox imageUrl="/ex1.jpg" />
            </Flex>
        </Layout>
    );
};

export default Home;
