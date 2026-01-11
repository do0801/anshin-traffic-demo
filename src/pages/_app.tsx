import "leaflet/dist/leaflet.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* スマホ幅にぴったり */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </Head>

      {/* グローバルCSS */}
      <style jsx global>{`
        html,
        body,
        #__next {
          height: 100%;
          margin: 0;
          padding: 0;
          background: #111;
          overscroll-behavior: none;
          touch-action: manipulation;
          font-family: system-ui, -apple-system, Segoe UI, Roboto,
            Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        /* iOSアドレスバー対策 */
        #__next {
          height: 100dvh;
        }
      `}</style>

      <Component {...pageProps} />
    </>
  );
}
