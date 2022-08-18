import { useEffect, useRef, useState } from "react";
import { createRoot, Root } from "react-dom/client";

const TIMEOUT_SEC = 5;

export default function useNotification()
{
    const root = useRef<Root>();
    const message = useRef<string>("");
    const [closeTimeout, setCloseTimeout] = useState<ReturnType<typeof setTimeout>>();

    const handleClose = () =>
    {
        stopTimer();
        if (root.current)
        {
            root.current.render(
                <Snackbar
                    show={false}
                    message={message.current}
                    closeClicked={handleClose}
                />
            );
        }
    };

    const stopTimer = () =>
    {
        clearTimeout(closeTimeout);
    };

    const restartTimer = () =>
    {
        stopTimer();
        const timeout: ReturnType<typeof setTimeout> = setTimeout(() => handleClose(), TIMEOUT_SEC * 1000);
        setCloseTimeout(timeout);
    };

    const notify = (m: string) =>
    {
        const el = document.getElementById('snackbar-notification');
        if (!root.current && el)
        {
            root.current = createRoot(el);
        }
        restartTimer();
        message.current = m;

        if (root.current)
        {
            root.current.render(
                <Snackbar
                    show={true}
                    message={m}
                    closeClicked={handleClose}
                />
            );
        }
    };

    useEffect(() =>
    {
        const el = document.getElementById('snackbar-notification');
        if (!root.current && el)
        {
            root.current = createRoot(el);
            root.current.render(
                <Snackbar
                    show={false}
                    message={""}
                    closeClicked={handleClose}
                />
            );
        }
    }, []);

    return {
        notify
    };
}

interface SnackbarProps
{
    message: string;
    show: boolean;
    closeClicked: () => void;
}

const Snackbar = ({ message, show, closeClicked }: SnackbarProps) =>
{
    return (
        <div
            style={{
                pointerEvents: show ? 'all' : 'none',
                opacity: show ? 1 : 0,
                position: "absolute", bottom: "1em", left: 0, right: 0, margin: "auto"
            }}
            className="transition-opacity bg-gray-900 flex items-center p-4 mb-4 w-full max-w-xs text-gray-500 rounded-lg shadow-lg" role="alert"
        >
            <div className="ml-3 text-sm font-normal">{message}</div>
            <button
                onClick={closeClicked}
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 bg-red-500 text-gray-400 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-red-400 inline-flex h-8 w-8" data-dismiss-target="#toast-danger" aria-label="Close"
            >
                <span className="sr-only">
                    Close
                </span>
                <svg
                    aria-hidden="true"
                    className="w-5 h-5 fill-white"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
};
