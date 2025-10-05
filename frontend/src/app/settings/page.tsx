"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  const sections = [
    { title: "Products", href: "/settings/products" },
    { title: "Categories", href: "/settings/categories" },
    { title: "Branches", href: "/settings/branches" },
    { title: "Branch Products", href: "/settings/branchProducts" },
    { title: "Consignment", href: "/settings/shops" },
    { title: "Consigned Products", href: "/settings/consignedProducts" },
    { title: "Suppliers", href: "/settings/suppliers" },
    { title: "Delivery Template", href: "/settings/delivery-templates" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {sections.map((sec) => (
          <Link key={sec.title} href={sec.href}>
            <Card className="hover:bg-[var(--color-bg-hover)] cursor-pointer p-4 text-center">
              {sec.title}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
