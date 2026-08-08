"use client";

import { useState } from "react";
import { FiAlertTriangle, FiLoader, FiAlertCircle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateLitige } from "@/lib/queries/useLitiges";

export default function SignalerDialog({ idStage }) {
  const [open, setOpen] = useState(false);
  const [typeLitige, setTypeLitige] = useState("");
  const [description, setDescription] = useState("");
  const mutation = useCreateLitige();

  function handleSubmit() {
    mutation.mutate(
      { idStage, typeLitige, description },
      {
        onSuccess: () => {
          setOpen(false);
          setTypeLitige("");
          setDescription("");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-sm border-destructive/40 text-destructive hover:bg-destructive/5"
        >
          <FiAlertTriangle className="h-4 w-4" />
          Signaler
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Signaler un problème</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Type de signalement</Label>
            <Input
              placeholder="Ex : Absence répétée, comportement inapproprié..."
              value={typeLitige}
              onChange={(e) => setTypeLitige(e.target.value)}
              className="h-11 rounded-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-y rounded-sm border border-border bg-background px-3.5 py-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          {mutation.isError && (
            <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
              {mutation.error.message}
            </div>
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              !typeLitige || description.length < 10 || mutation.isPending
            }
            className="h-11 w-full rounded-sm bg-destructive text-white hover:bg-destructive/90"
          >
            {mutation.isPending ? (
              <FiLoader className="h-4 w-4 animate-spin" />
            ) : (
              "Envoyer le signalement"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
