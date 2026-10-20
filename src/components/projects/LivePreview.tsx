// File: src/components/projects/LivePreview.tsx
import type { ReactNode } from "react";
import {
  PreviewLinkCard,
  PreviewLinkCardContent,
  PreviewLinkCardImage,
  PreviewLinkCardPortal,
  PreviewLinkCardTrigger,
} from "../../vendor/animate-ui/primitives/radix-ui/preview-link-card";

/**
 * Animate UI's Preview Link Card around the "Live site" action. Its own
 * module, so Radix and Floating UI load in a separate chunk, and only on
 * hover-capable devices once the Projects section is close.
 */
export default function LivePreview({
  href,
  name,
  preview,
  children,
}: {
  href: string;
  name: string;
  preview?: string;
  children: ReactNode;
}) {
  return (
    <PreviewLinkCard href={href} src={preview} width={320} height={200} openDelay={250} closeDelay={120}>
      <PreviewLinkCardTrigger className="pj-action pj-action--primary" target="_blank" rel="noreferrer noopener">
        {children}
      </PreviewLinkCardTrigger>
      <PreviewLinkCardPortal>
        <PreviewLinkCardContent
          className="pj-preview"
          side="top"
          sideOffset={12}
          target="_blank"
          rel="noreferrer noopener"
        >
          <PreviewLinkCardImage className="pj-preview__img" alt={`Screenshot of ${name}`} loading="lazy" />
        </PreviewLinkCardContent>
      </PreviewLinkCardPortal>
    </PreviewLinkCard>
  );
}