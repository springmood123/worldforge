'use client';

import { Globe } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-white/90 backdrop-blur border-b border-forge-copper/20 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-forge-copper to-forge-gold rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-forge-copper font-fantasy text-xl font-bold">WorldForge</h1>
              <p className="text-gray-500 text-xs">灵感激荡</p>
            </div>
          </div>

          {/* 空占位，保持布局对称 */}
          <div className="w-10"></div>
        </div>
      </div>
    </nav>
  );
}
