import Head from "next/head";

export const PageHead = () => {
  return (
    <Head>
      <link rel="shortcut icon" href="/imgs/auro.png" />
      <title>AURO E2E Test zkApp</title>
      <meta
        name="robots"
        content="max-snippet:-1,max-image-preview:standard,max-video-preview:-1"
      />
      <meta
        name="description"
        content="Available as a browser extension and as a mobile app, Auro Wallet perfectly supports Mina Protocol. easily send, receive or stake your MINA anytime."
      />
      <meta
        property="og:image"
        content="%PUBLIC_URL%/imgs/og_priview.png"
        data-rh="true"
      />
      <meta property="og:locale" content="en_US" />
      <meta property="og:type" content="website" />
      <meta
        property="og:title"
        content="Auro Wallet - Mina Protocol Wallet"
        data-rh="true"
      />
      <meta
        property="og:description"
        content="Available as a browser extension and as a mobile app, Auro Wallet perfectly supports Mina Protocol. easily send, receive or stake your MINA anytime."
      />
      {/* <meta property="og:url" content="https://www.aurowallet.com/" /> */}
      <meta property="og:site_name" content="Auro Wallet" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content="Auro Wallet - Mina Protocol Wallet"
        data-rh="true"
      />
      <meta
        name="twitter:description"
        content="Available as a browser extension and as a mobile app, Auro Wallet perfectly supports Mina Protocol. easily send, receive or stake your MINA anytime."
      />
      <meta
        name="twitter:image"
        content="%PUBLIC_URL%/imgs/og_priview.png"
        data-rh="true"
      />
    </Head>
  );
};
