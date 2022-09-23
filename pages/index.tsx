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
import { Form, Formik } from "formik";
import type { NextPage } from "next";
import { useState } from "react";
import { BsFillImageFill } from "react-icons/bs";
import { ExampleBox } from "../components/ExampleBox";
import { FileUpload, UploadableFile } from "../components/FileUpload";
import { Layout } from "../components/Layout";
import theme from "../theme";
import { uploadFile } from "../utils/uploadFile";

const Home: NextPage = () => {
    const [isMobile] = useMediaQuery("(max-width: 768px)");
    const { colorMode } = useColorMode();

    const [progress, setProgress] = useState(0);

    return (
        <Layout>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <Flex direction="column" align="center" textAlign="center">
                <Heading mb={4}>
                    Solve any wordsearch with just a picture!
                </Heading>
                <Formik
                    initialValues={{
                        image: null as UploadableFile | null,
                    }}
                    onSubmit={async (values, actions) => {
                        console.log(values);
                        if (!values.image) return;

                        const url = await uploadFile(
                            values.image.file,
                            setProgress
                        );
                        console.log(url);

                        setTimeout(() => {
                            actions.setSubmitting(false);
                        }, 1000);
                    }}
                >
                    {({ values, errors }) => (
                        <Form>
                            <Flex
                                padding={isMobile ? 2 : 0}
                                border="dashed 2px"
                                borderColor="gray.300"
                                borderRadius={6}
                                backgroundColor={
                                    colorMode === "light"
                                        ? "gray.50"
                                        : "gray.700"
                                }
                                width={isMobile ? "100%" : "500px"}
                                height="300px"
                                direction="column"
                                align="center"
                                justifyContent="space-evenly"
                                basis="100%"
                            >
                                <Flex align="center">
                                    <Icon
                                        as={BsFillImageFill}
                                        width="30px"
                                        height="30px"
                                        mr={2}
                                    />
                                    <FileUpload name="image" />
                                </Flex>
                                <Text>OR</Text>
                                {/* add later or smthn lolol */}
                                {/* <Button
                                    variant="primary"
                                    leftIcon={
                                        <Icon
                                            as={BsCameraVideoFill}
                                            width="30px"
                                            height="30px"
                                        />
                                    }
                                >
                                    Use a webcam
                                </Button>
                                <Text>OR</Text> */}
                                <Flex>
                                    <Input mr={2} placeholder="URL" />
                                    <Button variant="primary">Upload</Button>
                                </Flex>
                            </Flex>
                            {/* <Progress variant="determinate" value={progress} /> */}
                            {/* <button type="submit">Submit</button> */}

                            <Box mb={8} />
                        </Form>
                    )}
                </Formik>

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
