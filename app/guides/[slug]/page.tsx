import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {Fragment} from "react";
import {notFound} from "next/navigation";
import {GuideAd} from "@/components/ad-placements";
import {GuideStructuredData} from "@/components/structured-data";
import {getGuide,guides} from "@/lib/guides";
import {site} from "@/lib/site";

export const dynamicParams=false;
export function generateStaticParams(){return guides.map(({slug})=>({slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const guide=getGuide((await params).slug);return guide?{title:guide.title,description:guide.description,alternates:{canonical:`/guides/${guide.slug}/`},openGraph:{images:[guide.sections.find((s)=>s.visual)?.visual?.src||site.visual]}}:{}}

export default async function GuidePage({params}:{params:Promise<{slug:string}>}){
  const guide=getGuide((await params).slug);if(!guide)notFound();
  return <main className="lab-article"><GuideStructuredData guide={guide}/><nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Element Lab</Link><span>/</span><span>{guide.category}</span></nav><header className="article-lead"><p className="eyebrow">Lab note · {guide.updated}</p><h1>{guide.title}</h1><p className="dek">{guide.description}</p></header><section className="result-card"><span>Reproducible starting point</span><p>{guide.quickAnswer}</p></section><div className="notebook"><aside><span>Field sequence</span>{guide.sections.map((section,index)=><a key={section.heading} href={`#step-${index+1}`}>{String(index+1).padStart(2,"0")} {section.heading}</a>)}</aside><div className="notebook-pages">{guide.sections.map((section,index)=><Fragment key={section.heading}><section id={`step-${index+1}`}><div className="step-marker">{String(index+1).padStart(2,"0")}</div><h2>{section.heading}</h2>{section.paragraphs.map((paragraph)=><p key={paragraph}>{paragraph}</p>)}{section.visual?<figure data-asset-id={section.visual.assetId}><Image src={section.visual.src} width={section.visual.width} height={section.visual.height} sizes="(max-width: 900px) 100vw, 760px" alt={section.visual.alt}/><figcaption>{section.visual.caption}</figcaption></figure>:null}</section>{index===3?<GuideAd/>:null}</Fragment>)}<section className="sources"><h2>Sources &amp; further checks</h2>{guide.sources.map((source)=><p key={source.url}><a href={source.url} rel="noreferrer">{source.label} ↗</a></p>)}</section></div></div></main>;
}
