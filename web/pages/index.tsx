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
    UseToastOptions,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import { motion } from "framer-motion";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { createRef, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { BsFillImageFill } from "react-icons/bs";
import { ExampleBox } from "../components/ExampleBox";
import { Layout } from "../components/Layout";
import theme from "../theme";
import { errorAnim } from "../utils/errorAnim";
import { uploadToB2 } from "../utils/uploadToB2";

enum ErrorCode {
    invalidUrl,
    modelNotLoaded,
    wordsearchNotFound,
}

const errorToast = (err: string): UseToastOptions => {
    return {
        title: "Error",
        description: err,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
    };
};

const Home: NextPage = () => {
    const [isMobile] = useMediaQuery("(max-width: 768px)");
    const { colorMode } = useColorMode();
    const toast = useToast();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState("");

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
            if (values.file) {
                try {
                    url = await uploadToB2(values.file);
                } catch (e: any) {
                    toast(errorToast(e.message));
                    setCrashed();
                    return;
                }
                setStatus("Uploaded file...");
            } else if (values.url.length > 0) {
                url = values.url;
            }

            if (url.length > 0) {
                console.log("url:", url);
                setStatus("Identifying wordsearch...");

                var response = null;
                try {
                    response = await fetch(
                        `https://wordsearcher.azurewebsites.net/api/identifysearch?url=${url}`
                    );
                } catch (e: any) {
                    toast(
                        errorToast(
                            "Failed to connect to server. It might be down right now :("
                        )
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
                                    try {
                                        const newResponse = await fetch(
                                            `https://wordsearcher.azurewebsites.net/api/identifysearch?url=${url}`
                                        );
                                        const newData =
                                            await newResponse.json();
                                        if (!newData.error) {
                                            data = newData;
                                            got = true;
                                            break;
                                        }
                                    } catch (e: any) {}
                                }
                                if (!got)
                                    throw new Error(
                                        "Model not loaded, azure function is probably asleep. Please try again in ~5 seconds."
                                    );
                                break;
                            case ErrorCode.wordsearchNotFound:
                                throw new Error(
                                    "No wordsearch found in image. Please try using a different picture or use better lighting."
                                );
                        }
                    } catch (e: any) {
                        toast(errorToast(e.message));
                        setCrashed();
                        return;
                    }
                }
                console.log(data);

                const finalData = {
                    url,
                    ...data,
                };

                // insert into db
                var dbResponse = null;
                try {
                    dbResponse = await fetch(
                        "https://wordsearcher.azurewebsites.net/api/insertSolve",
                        {
                            method: "POST",
                            body: JSON.stringify(finalData),
                        }
                    );
                } catch (e: any) {
                    console.log(e);
                    toast(
                        errorToast(
                            "Failed to insert into the database. The database might be down :("
                        )
                    );
                    setCrashed();
                    return;
                }
                var dbData = await dbResponse.json();

                // push to solves/uid
                console.log(dbData);

                if (dbData.error) {
                    console.log(dbData.error);
                    toast(errorToast(dbData.error));
                    setCrashed();
                    return;
                }

                router.push(`/solve/${dbData.uid}`);
            }
            setLoading(false);
        },
    });

    const dropzoneRef = createRef<HTMLInputElement>();
    const onDrop = useCallback((acceptedFiles: File[]) => {
        formik.setFieldValue("file", acceptedFiles[0]);
        formik.submitForm();
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: true,
        accept: { "image/*": [] },
        maxSize: 10 * 1024 * 1024, // 10mb
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
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <Flex direction="column" align="center" textAlign="center">
                <Heading mb={4}>
                    Solve any wordsearch with just a picture!
                </Heading>
                <form onSubmit={formik.handleSubmit}>
                    <div {...getRootProps()}>
                        <Flex
                            padding={isMobile ? 2 : 0}
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
            </Flex>
        </Layout>
    );
};

export default Home;
