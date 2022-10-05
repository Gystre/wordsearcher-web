import {
    Button,
    Flex,
    Heading,
    IconButton,
    useColorMode,
} from "@chakra-ui/react";
import Image from "next/image";
import Link from "next/link";
import {
    BsFillQuestionCircleFill,
    BsMoonStarsFill,
    BsSun,
} from "react-icons/bs";

interface Props {}
export const Navbar: React.FC<Props> = () => {
    const { colorMode, toggleColorMode } = useColorMode();

    return (
        <Flex zIndex={999} top={0} p={4} align="center">
            <Flex
                flex={1}
                m="auto"
                maxW={800}
                align="center"
                justifyContent="space-between"
            >
                <Link href="/">
                    <Flex align="center" cursor="pointer">
                        <Image
                            src="/logo.png"
                            alt="logo"
                            width={50}
                            height={50}
                        />
                        <Heading
                            as="h1"
                            ml={2}
                            mr={4}
                            size="lg"
                            userSelect="none"
                        >
                            Wordsearcher
                        </Heading>
                    </Flex>
                </Link>

                {/* attach button click to google analytics later? */}
                <Flex align="center">
                    <a
                        href="https://github.com/gystre/wordsearcher"
                        target="_blank"
                    >
                        <IconButton
                            icon={<BsFillQuestionCircleFill title="About" />}
                            aria-label="About"
                            mr={2}
                        />
                    </a>
                    <Button
                        aria-label="Toggle Color Mode"
                        onClick={toggleColorMode}
                        _focus={{ boxShadow: "none" }}
                        w="fit-content"
                    >
                        {colorMode === "light" ? (
                            <BsMoonStarsFill title="Switch to dark mode" />
                        ) : (
                            <BsSun title="Switch to light mode" />
                        )}
                    </Button>
                </Flex>
            </Flex>
        </Flex>
    );
};
