// uppercase and only allow letters and number
export const cleanString = (str: string): string => {
    return str.toUpperCase().replace(/[^a-zA-Z0-9]/g, "");
};
