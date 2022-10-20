import { Box, Flex, Grid, useMediaQuery } from "@chakra-ui/react";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

/*
    Contains the navbar, wrapper component, and SEO tags.
    Use this to create a basic page layout.
*/

interface Props {
    children: React.ReactNode;
}

export const Layout: React.FC<Props> = ({ children }) => {
    const [isMobile] = useMediaQuery("(max-width: 768px)");

    return (
        <Grid templateRows="auto 1fr auto" height="100vh">
            <Navbar />
            <Box
                mt={isMobile ? 0 : 8}
                mx="auto"
                maxW={isMobile ? "400px" : ""}
                w="100%"
            >
                <Flex direction="column" align="center" textAlign="center">
                    {children}
                </Flex>
            </Box>
            <Footer />
        </Grid>
    );
};
