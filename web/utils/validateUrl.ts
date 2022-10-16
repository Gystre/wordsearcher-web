export const validateUrl = (url: string): boolean => {
    try {
        new URL(url);
    } catch (e) {
        return false;
    }
    return true;
};
