import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {HomeAd} from "@/components/ad-placements";
import {guides} from "@/lib/guides";
import {site} from "@/lib/site";

export const metadata:Metadata={alternates:{canonical:"/"}};

export default function Home(){
  return <main className="lab-home">
    <HomeAd/>
    <section className="lab-hero">
      <div className="lab-console">
        <p className="eyebrow">Independent reaction notebook</p>
        <h1>Build a cleaner<br/><em>element lab.</em></h1>
        <p className="intro">{site.description}</p>
        <div className="lab-actions"><Link className="primary-action" href={`/guides/${guides[0].slug}/`}>Run experiment 01</Link><a className="text-action" href="#experiments">Browse all notes ↓</a></div>
        <dl className="lab-readout"><div><dt>Notes</dt><dd>{guides.length}</dd></div><div><dt>Method</dt><dd>One variable</dd></div><div><dt>Rechecked</dt><dd>Sep 04</dd></div></dl>
      </div>
      <figure className="specimen-card"><span className="specimen-label">Live specimen / 001</span><Image src={site.visual} width={site.visualWidth} height={site.visualHeight} sizes="(max-width: 800px) 92vw, 42vw" priority alt={site.visualAlt}/><figcaption>Official game image · reactions can change with the live build</figcaption></figure>
    </section>
    <section className="experiment-index" id="experiments">
      <header className="index-heading"><p className="eyebrow">Experiment index</p><h2>Pick the reaction you need to reproduce.</h2><p>Each note keeps inputs, expected output, stop conditions and unknowns visible.</p></header>
      <div className="experiment-grid">{guides.map((guide,index)=><article key={guide.slug}><div className="experiment-no">E-{String(index+1).padStart(2,"0")}</div><p className="experiment-type">{guide.category}</p><h3><Link href={`/guides/${guide.slug}/`}>{guide.title}</Link></h3><p>{guide.description}</p><Link className="card-link" href={`/guides/${guide.slug}/`}>Open lab note <span>↗</span></Link></article>)}</div>
    </section>
  </main>;
}
