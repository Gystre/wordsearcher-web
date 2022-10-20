import { Button, Text } from "@chakra-ui/react";
import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { BsArrowLeft } from "react-icons/bs";
import { Layout } from "../components/Layout";

const FourOhFour: NextPage = () => {
    const description =
        "Have a word search you don't feel like solving? Solve it in Wordsearcher with just a picture! (^・ω・^ )";
    const imageUrl =
        "https://cdn.discordapp.com/attachments/200994742782132224/1029618061029941258/wordsearcher_preview_image.png";

    return (
        <Layout>
            <Head>
                <title>Wordsearcher</title>
                <meta name="title" content="Wordsearcher" />
                <meta name="description" content={description} />
                <meta
                    name="keywords"
                    content="wordsearcher,word search,solve"
                />
                <meta name="theme-color" content="#FF9A00" />
                <link rel="icon" href="/favicon.ico" />
                <meta property="og:type" content="website" />
                <meta
                    property="og:url"
                    content="https://wordsearcher.kyleyu.org"
                />
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
            <Text mb={2}>There&apos;s nothing here ＞︿＜</Text>
            <Link href="/" passHref>
                <Button
                    mr={2}
                    leftIcon={<BsArrowLeft title="Go back to homepage" />}
                    variant="primary"
                >
                    Go back
                </Button>
            </Link>
        </Layout>
    );
};

export default FourOhFour;
