import React from "react";
import {
  Banknote,
  Bike,
  Building,
  Car,
  Coins,
  CreditCard,
  GraduationCap,
  Heart,
  Home,
  Landmark,
  Laptop,
  type LucideIcon,
  PiggyBank,
  Plane,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Wallet as WalletIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  landmark: Landmark,
  smartphone: Smartphone,
  banknote: Banknote,
  "credit-card": CreditCard,
  wallet: WalletIcon,
  coins: Coins,
  building: Building,
  "shield-check": ShieldCheck,
  bike: Bike,
  heart: Heart,
  car: Car,
  plane: Plane,
  home: Home,
  laptop: Laptop,
  target: Target,
  sparkles: Sparkles,
  "piggy-bank": PiggyBank,
  "graduation-cap": GraduationCap,
};

interface DynamicIconProps {
  name: string;
  className?: string;
  strokeWidth?: number;
}

export function DynamicIcon({
  name,
  className = "w-4 h-4",
  strokeWidth = 1.75,
}: DynamicIconProps) {
  const IconComponent = ICON_MAP[name] ?? WalletIcon;
  return <IconComponent className={className} strokeWidth={strokeWidth} />;
}
