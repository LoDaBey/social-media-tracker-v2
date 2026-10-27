import Image from "next/image";
import type { BrandLogoProps } from "@/types/layout";

const LOGO_SRC = "/orbit.jpeg";
const INTRINSIC_WIDTH = 1600;
const INTRINSIC_HEIGHT = 533;

const SIZE_HEIGHT: Record<NonNullable<BrandLogoProps["size"]>, number> = {
  header: 40,
  login: 56,
};

export function BrandLogo({ size = "header", priority = false }: BrandLogoProps) {
  const height = SIZE_HEIGHT[size];
  const width = Math.round((height * INTRINSIC_WIDTH) / INTRINSIC_HEIGHT);

  return (
    <span className="inline-flex items-center">
      <Image
        src={LOGO_SRC}
        alt="Orbit"
        width={width}
        height={height}
        priority={priority}
        sizes={`${width}px`}
        className={
          size === "login"
            ? "h-auto w-auto object-contain dark:invert dark:hue-rotate-180 dark:mix-blend-lighten"
            : "h-auto w-auto object-contain object-left dark:invert dark:hue-rotate-180 dark:mix-blend-lighten"
        }
      />
    </span>
  );
}
