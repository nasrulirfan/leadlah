import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { Space_Grotesk } from "next/font/google";

const font = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "LeadLah | Property Agent OS for Malaysia",
  description:
    "LeadLah helps Malaysian real estate agents manage listings, reminders, calculators, and subscriptions in one dashboard.",
  keywords: [
    "Property Agent App Malaysia",
    "DSR Calculator",
    "Real Estate CRM",
    "LeadLah"
  ],
  openGraph: {
    title: "LeadLah | Property Agent OS for Malaysia",
    description:
      "Manage listings, fishbone workflow, branded PDF calculators, and billing in one modern web app.",
    url: "https://leadlah.com",
    siteName: "LeadLah",
    images: [
      {
        url: "https://dummyimage.com/1200x630/1d67ff/ffffff&text=LeadLah",
        width: 1200,
        height: 630,
        alt: "LeadLah Dashboard Preview"
      }
    ]
  },
  metadataBase: new URL("https://leadlah.com")
};

type Props = { children: React.ReactNode };

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" className={font.variable}>
      <body>
        <Script id="ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID ?? "GA_MEASUREMENT_ID"}');
          `}
        </Script>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "META_PIXEL_ID"}');
            fbq('track', 'PageView');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
