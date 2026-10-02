import Image from "next/image";

export type BrandLogoVariant = "mark" | "lockup" | "wordmark";
export type BrandLogoTone = "color" | "white" | "black";

const ASSETS = {
  mark: {
    color: "/colored_logo.png",
    white: "/white_logo.png",
    black: "/logo_black.png",
  },
  lockup: {
    color: "/colored_logo_and_name.png",
    white: "/white_logo_and_name.png",
    black: "/black_logo_and_name.png",
  },
  wordmark: {
    color: "/colored_name.png",
    white: "/white_name.png",
    black: "/black_name.png",
  },
} as const;

const ASPECT: Record<BrandLogoVariant, number> = {
  mark: 1,
  lockup: 2208 / 571,
  wordmark: 1461 / 441,
};

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  tone?: BrandLogoTone;
  height?: number;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  variant = "mark",
  tone = "color",
  height = 32,
  className,
  priority,
}: BrandLogoProps) {
  const src = ASSETS[variant][tone];
  const width = Math.round(height * ASPECT[variant]);

  return (
    <Image
      src={src}
      alt="Pantri"
      width={width}
      height={height}
      className={className}
      priority={priority}
      style={{ height, width: "auto" }}
    />
  );
}
