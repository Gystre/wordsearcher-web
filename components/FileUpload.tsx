import { Box, Text } from "@chakra-ui/react";
import { useField } from "formik";
import React, { useCallback, useEffect, useState } from "react";
import { FileError, FileRejection, useDropzone } from "react-dropzone";

export interface UploadableFile {
    file: File;
    errors: FileError[];
    url?: string;
}

interface FileUploadProps {
    name: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ name }) => {
    const [_, __, helpers] = useField(name);

    const [file, setFile] = useState<UploadableFile>();

    const onDrop = useCallback(
        (accFiles: File[], rejFiles: FileRejection[]) => {
            const mappedAcc = accFiles.map((file) => ({ file, errors: [] }));
            setFile([...mappedAcc, ...rejFiles][0]);
        },
        []
    );

    useEffect(() => {
        helpers.setValue(file);
        helpers.setTouched(true);
    }, [file]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
        maxSize: 300 * 1024, // 300 kb
    });

    const onDelete = () => {
        setFile(undefined);
    };

    const onUpload = (file: File, url: string) => {
        setFile({ file: file, errors: [], url: url });
    };

    var display = null;
    if (file) {
        if (file.errors.length > 0) {
            display = file.errors.map((error, idx) => (
                <Text key={idx} color="red">
                    {error.message}
                </Text>
            ));
        } else {
            display = file.file.name;
            // display = (
            //     <SingleFileUploadWithProgress
            //         file={file.file}
            //         onDelete={onDelete}
            //         onUpload={onUpload}
            //     />
            // );
        }
    }

    return (
        <>
            <div {...getRootProps()}>
                <input {...getInputProps()} />
                <Text>
                    Drag an image here or{" "}
                    <Box
                        display="inline"
                        textDecoration="underline"
                        cursor="pointer"
                        color="blue.300"
                    >
                        upload a file
                    </Box>
                </Text>
            </div>
            {display}
            {/* <Button onClick={() => onDelete()}>Delete</Button> */}
        </>
    );
};
