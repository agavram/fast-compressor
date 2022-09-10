import { Html, Head, Main, NextScript } from 'next/document';

export default function Document()
{
    return (
        <Html>
            <Head />
            <body style={{ backgroundColor: "#172032" }}>
                <Main />
                <NextScript />
                <div id="snackbar-notification" />
            </body>
        </Html>
    );
}
