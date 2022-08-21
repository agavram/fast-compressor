import { fetchFile } from "@ffmpeg/ffmpeg";
import imageCompression from "browser-image-compression";
import saveAs from "file-saver";
import { ffmpeg } from "../pages";

export const compressAndDownloadImage = async (name: string, file: File, setProgress: (n: number | null) => void) =>
{
    const compressedFile = await imageCompression(file, {
        alwaysKeepResolution: true,
        maxSizeMB: 8,
        onProgress(progress)
        {
            setProgress(progress);
        }
    });

    await saveAs(compressedFile, name);
};

export const compressAndDownloadVideo = async (name: string, file: File, setProgress: (n: number | null) => void) =>
{
    ffmpeg.FS('writeFile', file.name, await fetchFile(file));

    ffmpeg.setProgress((p) => setProgress(Math.round(p.ratio * 100)));

    await ffmpeg.run(
        '-i', file.name,
        '-c:v', 'libx264',
        '-crf', '32',
        '-preset', 'faster',
        name
    );

    setProgress(null);

    const data = ffmpeg.FS('readFile', name);
    saveAs(new Blob([data.buffer], { type: `video/mp4` }), name);
};
