import React from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  Bike,
  Briefcase,
  Building,
  Car,
  Coins,
  CreditCard,
  Film,
  Gift,
  GraduationCap,
  Heart,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  type LucideIcon,
  MoreHorizontal,
  PiggyBank,
  Plane,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Tag,
  Target,
  TrendingUp,
  Utensils,
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
  utensils: Utensils,
  "shopping-bag": ShoppingBag,
  receipt: Receipt,
  film: Film,
  "heart-pulse": HeartPulse,
  "more-horizontal": MoreHorizontal,
  briefcase: Briefcase,
  gift: Gift,
  "trending-up": TrendingUp,
  tag: Tag,
  "arrow-down-left": ArrowDownLeft,
  "arrow-up-right": ArrowUpRight,
  "arrow-left-right": ArrowLeftRight,
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
  const IconComponent = ICON_MAP[name] ?? Tag;
  return <IconComponent className={className} strokeWidth={strokeWidth} />;
}
