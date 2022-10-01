import { Box, Button, Link, useMediaQuery } from "@chakra-ui/react";
import Image from "next/image";
import React from "react";

interface ExampleBoxProps {
    imageUrl: string;
}

export const ExampleBox: React.FC<ExampleBoxProps> = ({ imageUrl }) => {
    const [isMobile] = useMediaQuery("(max-width: 768px)");

    const size = isMobile ? 300 : 150;

    return (
        // TODO: have this go to precreated link later
        <Link href="/">
            <Box
                mr={isMobile ? 0 : 2}
                mb={isMobile ? 2 : 0}
                position="relative"
                width={size}
                height={size}
                borderRadius="6px"
                border="2px solid"
                borderColor="brand.100"
            >
                <Image
                    src={imageUrl}
                    width={size}
                    height={size}
                    style={{
                        filter: "brightness(75%)",
                        borderRadius: "3px",
                    }}
                />
                <Button
                    variant="primary"
                    position="absolute"
                    bottom={3}
                    left="50%"
                    transform="translate(-50%, 0%)"
                >
                    Load
                </Button>
            </Box>
        </Link>
    );
};