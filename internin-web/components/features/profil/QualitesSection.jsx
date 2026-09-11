"use client";
import { useState } from "react";
import { Plus, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProfilSectionCard from "./ProfilSectionCard";
import { useUpdateStagiaireProfile } from "@/lib/queries/useStagiaireProfile";
import { useTranslation } from "@/lib/i18n/useTranslation";
export default function QualitesSection({ profil }) {
  const { t } = useTranslation(); const [open,setOpen]=useState(false); const [items,setItems]=useState(profil.qualites||[]); const [input,setInput]=useState(""); const update=useUpdateStagiaireProfile();
  function add(){const v=input.trim(); if(v && !items.some(x=>x.toLowerCase()===v.toLowerCase()) && items.length<30){setItems([...items,v]);setInput("");}}
  function save(){update.mutate({qualites:items},{onSuccess:()=>setOpen(false)});}
  return <><ProfilSectionCard title={t("stagiaireSpace.profile.qualities")} icon={Star} onEdit={()=>{setItems(profil.qualites||[]);setOpen(true)}}>{items.length?<div className="flex flex-wrap gap-2">{items.map((x,i)=><span key={i} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">{x}</span>)}</div>:<p className="text-sm text-muted-foreground">{t("stagiaireSpace.profile.qualitiesEmpty")}</p>}</ProfilSectionCard>
  <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{t("stagiaireSpace.profile.qualities")}</DialogTitle></DialogHeader><div className="space-y-4"><div className="flex gap-2"><Input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();add()}}} placeholder={t("stagiaireSpace.profile.qualityPlaceholder")} /><Button type="button" onClick={add}><Plus className="h-4 w-4" /></Button></div><div className="flex flex-wrap gap-2">{items.map((x,i)=><span key={i} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-sm">{x}<button type="button" onClick={()=>setItems(items.filter((_,j)=>j!==i))} aria-label={t("stagiaireSpace.profile.delete")}><X className="h-3.5 w-3.5" /></button></span>)}</div><Button onClick={save} disabled={update.isPending} className="w-full">{t("stagiaireSpace.profile.save")}</Button></div></DialogContent></Dialog></>;
}
