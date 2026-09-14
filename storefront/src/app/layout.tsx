import type { Metadata } from "next"
import Script from "next/script"
import { Inter, Newsreader, Noto_Sans_Thai, Space_Grotesk } from "next/font/google"
import { getBrand } from "@lib/brand"
import { getBaseURL } from "@lib/util/env"
import "styles/globals.css"

/**
 * Self-hosted at build time by next/font — no request to Google from a
 * visitor's browser, which is what lets the shop's privacy page say nothing on
 * it reaches a third party. All three Latin faces ship because the brand's
 * font is a *runtime* choice: the owner changes it in the admin and the page
 * must not have to be rebuilt.
 */
const thai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-thai",
  display: "swap",
})
const sans = Inter({ subsets: ["latin"], variable: "--font-sans-latin", display: "swap" })
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", display: "swap" })
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand()
  const name = brand.shop_name.th || brand.shop_name.en
  return {
    metadataBase: new URL(getBaseURL()),
    title: { default: name, template: `%s${brand.seo.title_suffix || ` | ${name}`}` },
    description: brand.seo.description || brand.tagline.th,
    openGraph: {
      title: name,
      description: brand.seo.description || brand.tagline.th,
      images: brand.seo.og_image_url ? [brand.seo.og_image_url] : undefined,
      type: "website",
    },
  }
}

/** The brand's colours, as the custom properties styles/brand.css maps. */
const brandVars = (c: Record<string, string>) =>
  [
    `--brand-primary:${c.primary}`,
    `--brand-on-primary:${c.on_primary}`,
    `--brand-accent:${c.accent}`,
    `--brand-ink:${c.ink}`,
    `--brand-paper:${c.paper}`,
    `--brand-muted:${c.muted}`,
  ].join(";")

const RADIUS: Record<string, [string, string]> = {
  sharp: ["0px", "0px"],
  soft: ["6px", "12px"],
  round: ["12px", "24px"],
}

const LATIN: Record<string, string> = {
  sans: "var(--font-sans-latin)",
  serif: "var(--font-serif)",
  display: "var(--font-display)",
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const brand = await getBrand()
  const [radius, radiusLg] = RADIUS[brand.radius] ?? RADIUS.soft
  const vars =
    `${brandVars(brand.colors as any)};` +
    `--brand-radius:${radius};--brand-radius-lg:${radiusLg};` +
    `--font-latin:${LATIN[brand.font] ?? LATIN.sans}`

  const a = brand.analytics

  return (
    <html
      lang="th"
      data-theme={brand.theme}
      className={`${thai.variable} ${sans.variable} ${serif.variable} ${display.variable}`}
    >
      <head>
        {/* The shop's own palette, written per request. `:root:root` doubles
            the specificity so that what the owner stored beats what a theme
            block in styles/brand.css declares — a theme selector is
            `html[data-theme=…]`, which outranks a plain `:root`. The tag ids
            below are whitelisted server-side to [A-Za-z0-9_-]
            (src/lib/brand-contract.ts) precisely because they end up inside
            these script tags. */}
        <style dangerouslySetInnerHTML={{ __html: `:root:root{${vars}}` }} />
        {a.gtm ? (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${a.gtm}');`}
          </Script>
        ) : null}
        {a.ga4 ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${a.ga4}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${a.ga4}');`}
            </Script>
          </>
        ) : null}
        {a.meta_pixel ? (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${a.meta_pixel}');fbq('track','PageView');`}
          </Script>
        ) : null}
        {a.tiktok_pixel ? (
          <Script id="tiktok-pixel" strategy="afterInteractive">
            {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(e,n){e[n]=function(){e.push([n].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e){var n="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=n;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]={};var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=n+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${a.tiktok_pixel}');ttq.page()}(window,document,'ttq');`}
          </Script>
        ) : null}
      </head>
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
