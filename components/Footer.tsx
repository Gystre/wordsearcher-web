import {
    Box,
    Flex,
    Heading,
    Text,
    useColorMode,
    useMediaQuery,
} from "@chakra-ui/react";
import Image from "next/image";
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
        <Flex width="100%" position="fixed" bottom={0} p={4}>
            <Flex
                align="center"
                justifyContent="space-between"
                // direction={isMobile ? "column" : "row"}
                m="auto"
                maxW={800}
            >
                <Image src="/logo.png" alt="logo" width={25} height={25} />

                <Heading size="sm" userSelect="none">
                    Wordsearcher
                </Heading>

                <Box ml={2} />
                {!isMobile ? (
                    <>
                        <Circle radius={8} color={iconColor} />
                        <Box ml={2} />
                    </>
                ) : null}

                <Text fontSize={isMobile ? "sm" : "md"}>
                    © 2022 Kyle Yu Inc.
                </Text>

                <Box ml={2} />
                {!isMobile ? (
                    <>
                        <Circle radius={8} color={iconColor} />
                        <Box ml={2} />
                    </>
                ) : null}

                <GithubIcon size={25} color={iconColor} />
                <Box ml={2} />
                <LinkedinIcon size={25} color={iconColor} />
            </Flex>
        </Flex>
    );
};
