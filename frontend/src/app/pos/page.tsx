"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

interface Product {
  id: number;
  name: string;
  price: number;
}

interface CartItem extends Product {
  qty: number;
}

export default function POSPage() {
  const [products] = useState<Product[]>([
    { id: 1, name: "เสื้อยืด", price: 200 },
    { id: 2, name: "กางเกง", price: 350 },
    { id: 3, name: "หมวก", price: 150 },
  ]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");

  const addToCart = (product: Product) => {
    const exists = cart.find((item) => item.id === product.id);
    if (exists) {
      setCart(cart.map((item) =>
        item.id === product.id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id: number, qty: number) => {
    setCart(cart.map((item) =>
      item.id === id ? { ...item, qty: qty > 0 ? qty : 1 } : item
    ));
  };

  const removeItem = (id: number) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="p-6 grid grid-cols-2 gap-6">
      {/* เลือกสินค้า */}
      <Card>
        <CardHeader>
          <CardTitle>เลือกสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="ค้นหาสินค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
          />
          <div className="space-y-2">
            {products
              .filter((p) => p.name.includes(search))
              .map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center border p-2 rounded"
                >
                  <span>{p.name} - {p.price} บาท</span>
                  <Button size="sm" onClick={() => addToCart(p)}>
                    เพิ่ม
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* ตะกร้าสินค้า */}
      <Card>
        <CardHeader>
          <CardTitle>ตะกร้าสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>สินค้า</TableHead>
                <TableHead>จำนวน</TableHead>
                <TableHead>ราคา</TableHead>
                <TableHead>ลบ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-16"
                      value={item.qty}
                      onChange={(e) => updateQty(item.id, Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>{item.price * item.qty}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      ลบ
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-between">
            <strong>ยอดรวม:</strong>
            <span>{total} บาท</span>
          </div>
          <Button className="mt-4 w-full">บันทึกการขาย</Button>
        </CardContent>
      </Card>
    </div>
  );
}
