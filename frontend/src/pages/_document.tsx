import {Html, Head, Main, NextScript} from 'next/document'

export default function Document() {
    return (
        <Html lang="en" data-theme="dark">
            <Head>
                {/* eslint-disable-next-line @next/next/google-font-display */}
                <link rel="stylesheet"
                      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,300,0,0"/>
                <meta name={"og:title"} content={"Wettr.xyz - AI Weather app on steroids"}/>
                <meta name={"og:description"} content={"Weather app for various places. The current day forecast is AI boosted."}/>
                <meta name={"og:url"} content={"https://wettr.xyz"}/>
                <meta name={"og:type"} content={"website"}/>
                <meta name={"og:site_name"} content={"Wettr.xyz - AI Weather Forecast"}/>
                <meta name={"og:locale"} content={"en_US"} />
            </Head>
            <body>
            <Main/>
            <NextScript/>
            </body>
        </Html>
    )
}
