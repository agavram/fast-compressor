import { createFFmpeg } from "@ffmpeg/ffmpeg";
import { useQuery } from "@tanstack/react-query";
import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import Dropzone from 'react-dropzone';
import useNotification from "../components/snackbar";
import { compressAndDownloadImage, compressAndDownloadVideo } from "../services/file-processor";
import { WarpSpeed } from "../services/warp-speed";

export const ffmpeg = createFFmpeg({
  corePath: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js",
  wasmPath: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm",
});

const Home: NextPage = () =>
{
  const [hover, setHover] = useState(false);
  const [progress, setProgress] = useState<null | number>(null);
  const { notify } = useNotification();
  const warpRef = useRef<WarpSpeed>();
  const animRef = useRef<number>();

  const onFocus = () =>
  {
    warpRef.current?.resume();
  };

  // User has switched away from the tab (AKA tab is hidden)
  const onBlur = () =>
  {
    console.log("paused");
    warpRef.current?.pause();
  };

  useEffect(() =>
  {
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    // Calls onFocus when the window first loads
    onFocus();
    // Specify how to clean up after this effect:
    return () =>
    {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);


  const { isLoading } = useQuery(["initialize"], async () =>
  {
    if (!ffmpeg.isLoaded())
    {
      await ffmpeg.load();
    }
  }, { staleTime: Infinity, refetchOnMount: true });

  const handleFiles = async (files: File[]) =>
  {
    if (files.length)
    {
      const file = files[0] as File;

      const end = file.name.indexOf(".");
      const name = file.name.substring(0, end) + "-compressed" + file.name.substring(end);

      try
      {
        if (file.name.toLowerCase().endsWith(".mp4"))
        {
          await compressAndDownloadVideo(name, file, setProgress);
        }
        else
        {
          await compressAndDownloadImage(name, file, setProgress);
        }
      }
      catch
      {
        notify("Unable to process file");
      }
      finally
      {
        setProgress(null);
      }
    }
  };

  useEffect(() =>
  {
    animRef.current && cancelAnimationFrame(animRef.current);

    if (hover)
    {
      const step = () =>
      {
        if (warpRef.current && warpRef.current.SPEED < 5)
        {
          warpRef.current.SPEED += 0.1;
          warpRef.current.TARGET_SPEED = 5;
          animRef.current = requestAnimationFrame(step);
        }
      };
      step();
    }
    else
    {
      const step = () =>
      {
        if (warpRef.current && warpRef.current.SPEED > 1)
        {
          warpRef.current.SPEED -= 0.1;
          warpRef.current.TARGET_SPEED = 1;
          animRef.current = requestAnimationFrame(step);
        }
      };
      step();
    }
  }, [hover]);

  return (
    <>
      <Head>
        <title>Compress Stuff</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col  h-screen relative">
        <canvas
          style={{ zIndex: -1 }}
          className="absolute w-full h-full t-0"
          id="canvas"
          ref={(canvas) =>
          {
            if (canvas && !warpRef.current)
            {
              canvas.getContext("2d")?.scale(50, 50);
              warpRef.current = new WarpSpeed("canvas", { "backgroundColor": "#172032", "starSize": 5, "density": 2 });
            }
          }}
        />
        <h1 className="pt-20 text-slate-900 font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-center dark:text-white">
          Compress Your Stuff
        </h1>
        <p className="mt-6 text-lg text-slate-600 text-center max-w-3xl mx-auto dark:text-slate-400">
          (Fully In-Browser 😎)
        </p>
        <div className="grow justify-center flex justify-center items-center w-full">
          {
            isLoading &&
            <div className="border border-slate-700 shadow rounded-md p-4 max-w-md w-full mx-auto">
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-6 py-1">
                  <div className="h-4 bg-slate-700 rounded"></div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-2 bg-slate-700 rounded col-span-2"></div>
                      <div className="h-2 bg-slate-700 rounded col-span-1"></div>
                    </div>
                    <div className="h-2 bg-slate-700 rounded"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-slate-700 rounded col-span-1"></div>
                  </div>
                </div>
              </div>
            </div>
          }
          {(progress !== null && !isLoading) &&
            <div className="w-1/2 rounded-full h-3 dark:bg-slate-600">
              <div className="bg-cyan-400 h-3 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
          }{(progress === null && !isLoading) &&
            <Dropzone
              onDragOver={() => setHover(true)}
              onDragLeave={() => setHover(false)}
              onDropAccepted={() => setHover(false)}
              onDropRejected={() => setHover(false)}
              accept={{
                'image/jpeg': [],
                'image/jpg': [],
                'image/png': [],
                'video/mp4': [],
              }}
              onDrop={handleFiles}>
              {({ getRootProps, getInputProps }) => (
                <label
                  onMouseOver={() => setHover(true)}
                  onMouseLeave={() => setHover(false)}
                  {...getRootProps()}
                  htmlFor="dropzone-file"
                  className="bg-slate-800/50 m-12 flex flex-col justify-center items-center w-full max-w-lg h-64  rounded-lg border-2 border-slate-500 border-dashed cursor-pointer hover:bg-slate-800/75">
                  <div className="flex flex-col justify-center items-center p-6">
                    <svg aria-hidden="true" className="mb-3 w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-200 text-center"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Images & .MP4 Supported</p>
                  </div>
                  <input {...getInputProps()} />
                </label>
              )}
            </Dropzone>
          }
        </div>
      </div>
    </>
  );
};

export default Home;
