import {
    Box,
    Flex,
    Heading,
    Text,
    useColorMode,
    useMediaQuery,
} from "@chakra-ui/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Circle } from "./Circle";
import { GithubIcon } from "./GithubIcon";
import { LinkedinIcon } from "./LinkedinIcon";

interface FooterProps {}

export const Footer: React.FC<FooterProps> = ({}) => {
    const [isMobile] = useMediaQuery("(max-width: 768px)");

    const { colorMode } = useColorMode();
    const iconColor = colorMode === "light" ? "black" : "white";

    return (
        <Flex
            align="center"
            justifyContent="space-between"
            // direction={isMobile ? "column" : "row"}
            m="auto"
            py={8}
            maxW={800}
        >
            <Link href="/">
                <Flex align="center" cursor="pointer">
                    <Image src="/logo.png" alt="logo" width={25} height={25} />
                    <Heading size="sm" userSelect="none">
                        Wordsearcher
                    </Heading>
                </Flex>
            </Link>

            <Box ml={2} />
            {!isMobile ? (
                <>
                    <Circle radius={8} color={iconColor} />
                    <Box ml={2} />
                </>
            ) : null}

            <a
                href="https://gystre.github.io/"
                target="_blank"
                rel="noreferrer"
            >
                <Text fontSize={isMobile ? "sm" : "md"}>
                    © 2022 Kyle Yu Inc.
                </Text>
            </a>

            <Box ml={2} />
            {!isMobile ? (
                <>
                    <Circle radius={8} color={iconColor} />
                    <Box ml={2} />
                </>
            ) : null}

            <a
                href="https://github.com/gystre"
                target="_blank"
                rel="noreferrer"
            >
                <GithubIcon size={25} color={iconColor} />
            </a>
            <Box ml={2} />
            <a
                href="https://www.linkedin.com/in/kyle-yu-3139a5140/"
                target="_blank"
                rel="noreferrer"
            >
                <LinkedinIcon size={25} color={iconColor} />
            </a>
        </Flex>
    );
};
