import {
    Box,
    Button,
    ColorModeScript,
    Flex,
    Heading,
    Icon,
    Input,
    Text,
    useColorMode,
    useMediaQuery,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import type { NextPage } from "next";
import { createRef, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { BsFillImageFill } from "react-icons/bs";
import { ExampleBox } from "../components/ExampleBox";
import { Layout } from "../components/Layout";
import theme from "../theme";

const Home: NextPage = () => {
    const [isMobile] = useMediaQuery("(max-width: 768px)");
    const { colorMode } = useColorMode();

    const [loading, setLoading] = useState(false);

    const formik = useFormik({
        initialValues: {
            file: null as File | null,
            url: "",
        },
        onSubmit: async (values, actions) => {
            // const url = await uploadFile(values.file, setProgress);
            // console.log(url);
            if (values.file) {
            } else if (values.url.length > 0) {
                setLoading(true);
                const response = await fetch(
                    `https://wordsearcher.azurewebsites.net/api/identifysearch?url=${values.url}`
                );
                const data = await response.json();
                setLoading(false);
                console.log(data);
            }

            setTimeout(() => {
                actions.setSubmitting(false);
            }, 1000);
        },
    });

    const dropzoneRef = createRef<HTMLInputElement>();
    const onDrop = useCallback((acceptedFiles: File[]) => {
        formik.setFieldValue("file", acceptedFiles[0]);
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: true,
        accept: { "image/*": [] },
        maxSize: 8 * 1024 * 1024, // 8mb
    });

    var display: any = null;
    if (isDragActive) {
        display = <Text>Drop an image</Text>;
    } else {
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
                        name="url"
                    />
                    <Button variant="primary" type="submit" isLoading={loading}>
                        Upload
                    </Button>
                </Flex>
            </>
        );
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
                            borderColor="gray.300"
                            borderRadius={6}
                            backgroundColor={
                                colorMode === "light" ? "gray.50" : "gray.700"
                            }
                            width={isMobile ? "100%" : "500px"}
                            height="300px"
                            direction="column"
                            align="center"
                            justifyContent="space-evenly"
                            basis="100%"
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
