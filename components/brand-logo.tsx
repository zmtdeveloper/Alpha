import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
};

export function BrandLogo({
  className,
  markClassName,
  textClassName,
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-md bg-foreground text-sm font-bold text-background",
          markClassName,
        )}
      >
        A
      </span>
      <span
        className={cn("text-sm font-semibold text-foreground", textClassName)}
      >
        Alpha
      </span>
    </span>
  );
}
