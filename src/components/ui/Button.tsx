// File: src/components/ui/Button.tsx
import type { ReactNode } from "react";
import { LiquidButton } from "../../vendor/animate-ui/primitives/buttons/liquid";
import "./Button.css";

/*
 * The site's two button styles, both Animate UI's LiquidButton: on hover a
 * line of colour slides in along the bottom edge, then rises to fill the
 * button. Links go through `asChild`, so they stay real <a> elements with
 * normal navigation, middle-click and history.
 */

type Variant = "primary" | "ghost";

interface BaseProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

interface LinkProps extends BaseProps {
  href: string;
  external?: boolean;
}

interface ActionProps extends BaseProps {
  href?: never;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}

export function Button(props: LinkProps | ActionProps) {
  const { variant = "primary", children, className } = props;
  const cls = ["btn", `btn--${variant}`, className].filter(Boolean).join(" ");

  if (props.href !== undefined) {
    const external = props.external ? { target: "_blank", rel: "noreferrer noopener" } : {};
    return (
      <LiquidButton asChild className={cls} delay="0.28s">
        <a href={props.href} {...external}>
          {children}
        </a>
      </LiquidButton>
    );
  }

  return (
    <LiquidButton
      className={cls}
      delay="0.28s"
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {children}
    </LiquidButton>
  );
}