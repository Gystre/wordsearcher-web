import { ChakraProvider } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import ReactGA from "react-ga4";
import theme from "../utils/theme";

ReactGA.initialize(process.env.NEXT_PUBLIC_GA_TRACKING_ID);
ReactGA.send("pageview");

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <ChakraProvider theme={theme}>
            <Component {...pageProps} />
        </ChakraProvider>
    );
}

export default MyApp;
