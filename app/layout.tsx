import type {Metadata} from "next";
import Link from "next/link";
import {SocialBar} from "@/components/ad-placements";
import {Telemetry} from "@/components/telemetry";
import release from "@/config/release.json";
import {site} from "@/lib/site";
import {SiteStructuredData} from "@/components/structured-data";
import "./globals.css";
import "./responsive.css";

export const metadata:Metadata={metadataBase:new URL(site.url),title:{default:site.homeTitle,template:`%s | ${site.name}`},description:site.description,robots:{index:release.allowIndexing,follow:release.allowIndexing},openGraph:{type:"website",siteName:site.name,title:site.homeTitle,description:site.description,images:[site.visual]}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={site.theme}><SiteStructuredData/><header className="lab-header"><Link className="lab-brand" href="/"><span className="brand-mark">EL</span><span><b>Element Lab</b><small>Sandbox field notes</small></span></Link><nav><Link href="/">Experiments</Link><Link href="/about/">Method</Link></nav><span className="signal"><i/> System ready</span></header>{children}<footer className="lab-footer"><p><b>{site.name}</b><br/>Independent fan reference. Not affiliated with the developer or platform.</p><nav><Link href="/about/">Method</Link><Link href="/privacy/">Privacy</Link><Link href="/contact/">Contact</Link></nav></footer><Telemetry/><SocialBar/></body></html>}
