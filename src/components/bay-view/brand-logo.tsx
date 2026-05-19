import {
  BMWIcon,
  HondaIcon,
  HyundaiIcon,
  KiaIcon,
  LandroverIcon,
  LexusIcon,
  MazdaIcon,
  MBIcon,
  NissanIcon,
  ToyotaIcon,
} from "@cardog-icons/react";
import { cn } from "@/lib/utils";

const BRAND_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  toyota: ToyotaIcon,
  lexus: LexusIcon,
  honda: HondaIcon,
  hyundai: HyundaiIcon,
  kia: KiaIcon,
  mercedes: MBIcon,
  bmw: BMWIcon,
  land: LandroverIcon,
  nissan: NissanIcon,
  mazda: MazdaIcon,
};

export function BrandLogo({
  make,
  className,
}: {
  make: string;
  className?: string;
}) {
  const key = make.toLowerCase();
  const Component = Object.entries(BRAND_COMPONENTS).find(([k]) =>
    key.includes(k),
  )?.[1];

  if (!Component) {
    return (
      <span className="text-[10px] font-semibold leading-none">
        {make.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return <Component className={cn("size-5", className)} />;
}
