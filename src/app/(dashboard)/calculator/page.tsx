import { Metadata } from "next";
import { CompoundInterestCalculator } from "@/components/modules/calculator/CompoundInterestCalculator";

export const metadata: Metadata = {
  title: "Kalkulator Bunga Majemuk — Pintar Finance",
  description:
    "Simulasikan pertumbuhan aset investasi dan hitung akumulasi bunga majemuk secara presisi di Pintar Finance.",
};

export default function CalculatorPage() {
  return (
    <div className="space-y-6">
      <CompoundInterestCalculator />
    </div>
  );
}
