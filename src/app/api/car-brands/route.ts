import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET car brands — returns a curated list + any brands from existing customers
export async function GET() {
  // Curated luxury + common brands in Egypt
  const curated = [
    "Mercedes-Benz", "BMW", "Audi", "Volkswagen", "Porsche",
    "Lexus", "Toyota", "Honda", "Nissan", "Mazda",
    "Hyundai", "Kia", "Chevrolet", "Ford", "MG",
    "Land Rover", "Range Rover", "Jaguar", "Volvo",
    "Mitsubishi", "Subaru", "Infiniti", "Cadillac",
    "Mini Cooper", "Fiat", "Renault", "Peugeot", "Citroen",
    "BYD", "Tesla",
  ];

  // Also fetch any brands saved by customers (in case of custom entries)
  let customerBrands: string[] = [];
  try {
    const rows = await db.customer.findMany({
      where: { carBrand: { not: null } },
      select: { carBrand: true },
      distinct: ["carBrand"],
    });
    customerBrands = rows
      .map((r) => r.carBrand)
      .filter((b): b is string => b !== null && !curated.includes(b));
  } catch {
    /* ignore */
  }

  return NextResponse.json({ brands: [...curated, ...customerBrands] });
}
