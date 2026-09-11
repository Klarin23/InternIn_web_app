"use client";

import { FiBriefcase } from "react-icons/fi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import OffreForm from "./OffreForm";
import { useOffreEntreprise } from "@/lib/queries/useCreateOffre";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useEffect, useRef, useState } from "react";

export default function OffreFormDialog({ open, onOpenChange, idOffre }) {
  const { t } = useTranslation();
  const scrollRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const { data: existingOffre, isLoading } = useOffreEntreprise(idOffre);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return undefined;

    const handleScroll = () => {
      setIsScrolling(true);
      window.clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
      }, 650);
    };

    element.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      element.removeEventListener("scroll", handleScroll);
      window.clearTimeout(scrollTimeoutRef.current);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, idOffre]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="offre-form-dialog max-h-[88vh] overflow-hidden rounded-md sm:max-w-190"
      >
        <style jsx>{`
          .offre-form-dialog-scroll-area {
            scrollbar-width: none;
            -ms-overflow-style: none;
            overscroll-behavior: contain;
          }

          .offre-form-dialog-scroll-area::-webkit-scrollbar {
            width: 0;
            height: 0;
          }

          .offre-form-dialog-scroll-area.is-scrolling {
            scrollbar-width: thin;
            scrollbar-color: hsl(var(--muted-foreground) / 0.35) transparent;
          }

          .offre-form-dialog-scroll-area.is-scrolling::-webkit-scrollbar {
            width: 5px;
          }

          .offre-form-dialog-scroll-area.is-scrolling::-webkit-scrollbar-track {
            background: transparent;
          }

          .offre-form-dialog-scroll-area.is-scrolling::-webkit-scrollbar-thumb {
            background: hsl(var(--muted-foreground) / 0.35);
            border-radius: 999px;
          }

          .offre-form-dialog-scroll-area.is-scrolling::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--muted-foreground) / 0.5);
          }
        `}</style>

        <div
          ref={scrollRef}
          className={`offre-form-dialog-scroll-area min-h-0 max-h-[calc(88vh-2rem)] overflow-y-auto pr-1 ${
            isScrolling ? "is-scrolling" : ""
          }`}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FiBriefcase className="h-4.5 w-4.5" />
              </div>
              <div>
                <DialogTitle>
                  {idOffre
                    ? t("entrepriseSpace.offers.editOfferTitle")
                    : t("entrepriseSpace.offers.newOfferTitle")}
                </DialogTitle>
                <DialogDescription>
                  {idOffre
                    ? t("entrepriseSpace.offers.editOfferDesc")
                    : t("entrepriseSpace.offers.newOfferDesc")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {idOffre && isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("entrepriseSpace.offers.loading")}
            </p>
          ) : (
            <OffreForm
              existingOffre={idOffre ? existingOffre : null}
              onSuccess={() => onOpenChange(false)}
              onCancel={() => onOpenChange(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
