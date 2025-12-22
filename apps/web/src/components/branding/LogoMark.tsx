import Image from "next/image";

import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: number;
  priority?: boolean;
};

export function LogoMark({ className, size = 24, priority }: Props) {
  return (
    <Image
      src="/brand/leadlah-symbol.png"
      alt="LeadLah"
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 select-none", className)}
    />
  );
}
