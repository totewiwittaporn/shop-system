"use client";

import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: LayoutProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800">
      <div className="w-full max-w-md bg-gray-700 rounded-2xl">
        {children}
      </div>
    </div>
  );
}
