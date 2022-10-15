function yyyymmdd() {
    var x = new Date();
    var y = x.getFullYear().toString();
    var m = (x.getMonth() + 1).toString();
    var d = x.getDate().toString();
    d.length == 1 && (d = "0" + d);
    m.length == 1 && (m = "0" + m);
    var yyyymmdd = y + m + d;
    return yyyymmdd;
}

export const genFileName = (fileName: string) => {
    const date = yyyymmdd();
    const randomString = Math.random().toString(36).substring(2, 7);
    const cleanFileName = fileName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    return `images/${date}-${randomString}-${cleanFileName}`;
};
