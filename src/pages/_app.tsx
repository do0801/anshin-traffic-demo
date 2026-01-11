import "leaflet/dist/leaflet.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        html, body, #__next {
          height: 100%;
          margin: 0;
          background: #111;
          overscroll-behavior: none;
          touch-action: manipulation;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
        }
        * { box-sizing: border-box; }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}
