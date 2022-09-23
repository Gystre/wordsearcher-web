import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
    initialColorMode: "light",
    useSystemColorMode: true,
};

const theme = extendTheme({
    config,
    colors: {
        brand: {
            100: "#FF9A00",
        },
    },
    components: {
        Button: {
            variants: {
                primary: {
                    bg: "brand.100",
                },
            },
        },
    },
});

export default theme;
