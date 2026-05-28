'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Map, RefreshCw, Download, MapPin, ZoomIn, ZoomOut } from 'lucide-react';

interface City {
  x: number;
  y: number;
  name: string;
  highlighted: boolean;
}

interface MapGeneratorProps {
  worldTheme: string;
}

// 预设地名库
const DEFAULT_PLACE_NAMES = [
  '晨曦港', '月影森林', '青石山脉', '风暴海岸', '火焰谷地', '冰霜高原',
  '翡翠湾', '迷雾沼泽', '黄金沙漠', '天空之城', '深渊洞穴', '时光裂隙',
  '巨龙巢穴', '精灵圣地', '矮人王国', '人类联邦', '兽人部落', '亡灵废墟',
  '圣光城堡', '暗影峡谷', '风暴要塞', '绿洲城', '冰封王座', '火山岛',
  '奇迹之塔', '遗忘之地', '永恒花园', '末日废墟', '新生平原', '古老神殿'
];

// Perlin noise implementation
class PerlinNoise {
  private permutation: number[];

  constructor(seed: number) {
    this.permutation = new Array(512);
    const p = new Array(256);
    
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    
    // Shuffle using seed
    const random = this.mulberry32(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    
    for (let i = 0; i < 512; i++) {
      this.permutation[i] = p[i & 255];
    }
  }

  private mulberry32 = (a: number) => () => {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    const u = this.fade(x);
    const v = this.fade(y);
    
    const A = this.permutation[X] + Y;
    const AA = this.permutation[A];
    const AB = this.permutation[A + 1];
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B];
    const BB = this.permutation[B + 1];
    
    return this.lerp(v,
      this.lerp(u, this.grad(this.permutation[AA], x, y),
                  this.grad(this.permutation[BA], x - 1, y)),
      this.lerp(u, this.grad(this.permutation[AB], x, y - 1),
                  this.grad(this.permutation[BB], x - 1, y - 1))
    );
  }
}

export default function MapGenerator({ worldTheme }: MapGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [seed, setSeed] = useState(Math.random());
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%
  const [mapStyle, setMapStyle] = useState<'standard' | 'archipelago' | 'continental' | 'desert'>('standard');

  // Mulberry32随机数生成器 - 用于地名生成
  const mulberry32 = (seed: number) => {
    return () => {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };

  // 生成随机地名 - 确保多样性，避免重复
  const generateRandomPlaceName = useCallback((index: number, seed: number, usedNames: Set<string>): string => {
    const random = mulberry32(Math.floor(seed * 10000) + index * 12345);
    let attempts = 0;
    let name: string;
    
    // 最多尝试20次找到未使用的地名
    do {
      const randomIndex = Math.floor(random() * DEFAULT_PLACE_NAMES.length);
      name = DEFAULT_PLACE_NAMES[randomIndex];
      attempts++;
      
      // 如果找到未使用的地名，或者尝试次数过多，就使用这个
      if (!usedNames.has(name) || attempts > 20) {
        break;
      }
    } while (attempts < 20);
    
    return name;
  }, []);

  // 多尺度噪声获取高度
  const getHeight = useCallback((x: number, y: number, seed: number, style: string): number => {
    const noise = new PerlinNoise(seed);
    let height = 0;
    let scale = 1;
    let amplitude = 0.5;
    
    // 根据地图风格调整噪声参数
    let octaves = 6;
    let baseScale = 0.01;
    
    if (style === 'archipelago') {
      octaves = 7;
      baseScale = 0.015;
    } else if (style === 'continental') {
      octaves = 5;
      baseScale = 0.008;
    } else if (style === 'desert') {
      octaves = 4;
      baseScale = 0.02;
    }
    
    for (let i = 0; i < octaves; i++) {
      height += noise.noise(x * scale * baseScale, y * scale * baseScale) * amplitude;
      scale *= 2;
      amplitude *= 0.5;
    }
    
    // 根据风格调整高度分布
    if (style === 'archipelago') {
      // 群岛 - 更多海洋
      height = height * 0.8 - 0.1;
    } else if (style === 'continental') {
      // 大陆 - 更多陆地
      height = height * 0.8 + 0.1;
    } else if (style === 'desert') {
      // 沙漠 - 平坦地形
      height = height * 0.5;
    }
    
    return height;
  }, []);

  // 颜色插值函数
  const interpolateColor = (color1: string, color2: string, t: number): string => {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // 根据高度和风格获取颜色
  const getColor = useCallback((height: number, style: string): string => {
    if (style === 'desert') {
      // 沙漠主题
      if (height < -0.2) return '#1e3a5f'; // 海洋
      if (height < -0.1) return '#f5e6c8'; // 沙滩
      if (height < 0.1) return '#d4a76a'; // 沙漠
      if (height < 0.2) return '#c9a06e'; // 沙丘
      if (height < 0.35) return '#8b7355'; // 岩石
      return '#a89078'; // 高地
    }

    // 标准主题
    if (height < -0.35) {
      const t = (height + 0.5) / 0.15;
      return interpolateColor('#0a1628', '#1e3a5f', Math.max(0, t));
    }
    if (height < -0.2) {
      const t = (height + 0.35) / 0.15;
      return interpolateColor('#1e3a5f', '#2d5a87', t);
    }
    if (height < -0.1) {
      const t = (height + 0.2) / 0.1;
      return interpolateColor('#f5e6c8', '#e8d5b7', t);
    }
    if (height < 0.05) {
      const t = (height + 0.1) / 0.15;
      return interpolateColor('#6b8e4e', '#4a7c59', t);
    }
    if (height < 0.2) {
      const t = (height - 0.05) / 0.15;
      return interpolateColor('#4a7c59', '#2d5a3d', t);
    }
    if (height < 0.35) {
      const t = (height - 0.2) / 0.15;
      return interpolateColor('#8b9a7d', '#6b7b8a', t);
    }
    if (height < 0.5) {
      const t = (height - 0.35) / 0.15;
      return interpolateColor('#6b7b8a', '#9ca5a0', t);
    }
    const t = (height - 0.5) / 0.5;
    return interpolateColor('#e8e8e8', '#ffffff', Math.min(1, t));
  }, []);

  // 生成河流
  const generateRivers = useCallback((width: number, height: number, seed: number, style: string): number[][][] => {
    const rivers: number[][][] = [];
    const noise = new PerlinNoise(seed);
    
    let numRivers = style === 'desert' ? 1 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 3);
    
    for (let r = 0; r < numRivers; r++) {
      const river: number[][] = [];
      let x = Math.floor(width * (0.2 + Math.sin(seed * (r + 1)) * 0.3));
      let y = Math.floor(height * (0.15 + Math.cos(seed * (r + 2)) * 0.2));
      
      let maxHeight = -1;
      let startX = x, startY = y;
      for (let dx = -20; dx <= 20; dx++) {
        for (let dy = -20; dy <= 20; dy++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const h = noise.noise(nx * 0.01, ny * 0.01);
            if (h > maxHeight) {
              maxHeight = h;
              startX = nx;
              startY = ny;
            }
          }
        }
      }
      
      x = startX;
      y = startY;
      
      for (let i = 0; i < 150; i++) {
        river.push([x, y]);
        
        let bestDir = [0, 1];
        let bestHeight = noise.noise(x * 0.01, y * 0.01);
        
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const h = noise.noise(nx * 0.01, ny * 0.01);
              if (h < bestHeight) {
                bestHeight = h;
                bestDir = [dx, dy];
              }
            }
          }
        }
        
        x += bestDir[0];
        y += bestDir[1];
        
        if (noise.noise(x * 0.01, y * 0.01) < -0.2 || x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) {
          river.push([x, y]);
          break;
        }
      }
      
      if (river.length > 10) {
        rivers.push(river);
      }
    }
    
    return rivers;
  }, []);

  // 使用 ref 跟踪初始化状态和上一个 seed
  const initializedRef = useRef(false);
  const lastDrawnSeedRef = useRef<number | null>(null);

  // 初始化绘制 - 只在组件首次挂载时执行一次
  useEffect(() => {
    if (initializedRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    initializedRef.current = true;
    
    // 设置初始seed
    const initialSeed = Math.random();
    setSeed(initialSeed);
    
    // 立即绘制地图
    drawMapOnce(initialSeed);
  }, []); // 空依赖数组，只在挂载时执行

  // 绘制地图的独立函数（不依赖回调）
  const drawMapOnce = (mapSeed: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext('2d')!;

    const blockSize = 2;
    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        let avgHeight = 0;
        let samples = 0;
        for (let dy = 0; dy < blockSize; dy++) {
          for (let dx = 0; dx < blockSize; dx++) {
            if (x + dx < width && y + dy < height) {
              avgHeight += getHeight(x + dx, y + dy, mapSeed, mapStyle);
              samples++;
            }
          }
        }
        avgHeight /= samples;
        offCtx.fillStyle = getColor(avgHeight, mapStyle);
        offCtx.fillRect(x, y, blockSize, blockSize);
      }
    }

    ctx.filter = 'blur(0.5px)';
    ctx.drawImage(offscreen, 0, 0);
    ctx.filter = 'none';

    const rivers = generateRivers(width, height, mapSeed, mapStyle);
    rivers.forEach(river => {
      ctx.beginPath();
      ctx.strokeStyle = mapStyle === 'desert' ? '#4a7c59' : '#1a4d7a';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      for (let i = 0; i < river.length; i++) {
        const [x, y] = river[i];
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prev = river[i - 1];
          const midX = (prev[0] + x) / 2;
          const midY = (prev[1] + y) / 2;
          ctx.quadraticCurveTo(prev[0], prev[1], midX, midY);
        }
      }
      ctx.stroke();
      
      ctx.strokeStyle = mapStyle === 'desert' ? '#6b8e4e' : '#2d6a9a';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    const coastImageData = ctx.getImageData(0, 0, width, height);
    const data = coastImageData.data;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        let hasOcean = false;
        let hasLand = false;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nidx = ((y + dy) * width + (x + dx)) * 4;
            const nr = data[nidx];
            const ng = data[nidx + 1];
            const nb = data[nidx + 2];
            
            if (nr < 100 && nb > 100) {
              hasOcean = true;
            } else if (nr > 100 || g > 100) {
              hasLand = true;
            }
          }
        }
        
        if (hasOcean && hasLand) {
          data[idx] = Math.min(255, r + 20);
          data[idx + 1] = Math.min(255, g + 15);
          data[idx + 2] = Math.min(255, b);
        }
      }
    }
    
    ctx.putImageData(coastImageData, 0, 0);

    ctx.globalCompositeOperation = 'multiply';
    const shadowGradient = ctx.createLinearGradient(0, 0, width, height);
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.05)');
    shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
    ctx.fillStyle = shadowGradient;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';

    const noise = new PerlinNoise(mapSeed);
    const newCities: City[] = [];
    const numCities = mapStyle === 'archipelago' ? 4 + Math.floor(Math.random() * 4) : 6 + Math.floor(Math.random() * 5);
    const usedNames = new Set<string>(); // 跟踪已使用的地名
    
    for (let i = 0; i < numCities; i++) {
      let attempts = 0;
      let x, y;
      
      do {
        x = Math.floor(Math.random() * width);
        y = Math.floor(Math.random() * height);
        attempts++;
      } while (noise.noise(x * 0.01, y * 0.01) < -0.05 && attempts < 50);
      
      // 传入已使用的地名集合，避免重复
      const cityName = generateRandomPlaceName(i, mapSeed, usedNames);
      usedNames.add(cityName);
      newCities.push({ x, y, name: cityName, highlighted: false });
    }
    
    setCities(newCities);
  };

  // 更新地图 - 手动触发
  const regenerateMap = () => {
    const newSeed = Math.random();
    setSeed(newSeed);
    drawMapOnce(newSeed);
  };

  // 绘制城市标记和名称 - 仅在城市列表或悬停状态变化时更新标记
  useEffect(() => {
    // 等待地图和城市数据都准备好
    if (cities.length === 0 || !initializedRef.current) return;
    
    // 检查是否需要重绘（避免重复绘制）
    if (lastDrawnSeedRef.current === seed) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 更新最后绘制的seed
    lastDrawnSeedRef.current = seed;
    
    // 绘制城市标记和名称
    cities.forEach(city => {
      const gradient = ctx.createRadialGradient(city.x, city.y, 0, city.x, city.y, 12);
      gradient.addColorStop(0, city.highlighted ? 'rgba(184, 115, 51, 0.3)' : 'rgba(212, 175, 55, 0.2)');
      gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(city.x, city.y, 12, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = city.highlighted ? '#b87333' : '#d4af37';
      ctx.beginPath();
      ctx.arc(city.x, city.y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(city.x, city.y, 2, 0, Math.PI * 2);
      ctx.fill();

      // 绘制城市名称标签
      if (city.name) {
        ctx.fillStyle = '#2d3748';
        ctx.font = '12px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(city.name, city.x, city.y - 15);
        
        // 添加文字背景提高可读性
        const textWidth = ctx.measureText(city.name).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(city.x - textWidth / 2 - 3, city.y - 26, textWidth + 6, 14);
        
        ctx.fillStyle = '#2d3748';
        ctx.fillText(city.name, city.x, city.y - 15);
      }
    });
  }, [cities, seed]);

  // 监听地图风格变化 - 重新生成地图
  useEffect(() => {
    if (!initializedRef.current) return;
    
    // 生成新seed并重绘
    const newSeed = Math.random();
    setSeed(newSeed);
    drawMapOnce(newSeed);
  }, [mapStyle]);

  // 导出图片
  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `worldforge-map-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const canvasWidth = Math.floor(600 * zoomLevel);
  const canvasHeight = Math.floor(500 * zoomLevel);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Canvas 区域 */}
      <div className="flex-1">
        <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-forge-copper/20 shadow">
          {/* 顶部控制栏 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-700 text-sm">地图风格:</span>
              <select 
                value={mapStyle}
                onChange={(e) => setMapStyle(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700"
              >
                <option value="standard">标准大陆</option>
                <option value="archipelago">群岛模式</option>
                <option value="continental">大陆模式</option>
                <option value="desert">沙漠主题</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-700 text-sm">缩放:</span>
              <button
                onClick={handleZoomOut}
                className="p-1 border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
                title="缩小"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-gray-700 text-sm w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={handleZoomIn}
                className="p-1 border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
                title="放大"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="w-full max-w-[600px] mx-auto rounded-lg border border-gray-300 shadow-sm transition-all"
            style={{ 
              transform: zoomLevel !== 1 ? `scale(${1/zoomLevel})` : 'none',
              transformOrigin: 'center center',
              width: `${canvasWidth}px`,
              maxWidth: '100%'
            }}
          />
        </div>
        
        {/* 控制按钮 */}
        <div className="flex gap-4 mt-4 justify-center">
          <button
            onClick={regenerateMap}
            disabled={loading}
            className="px-6 py-2 bg-white border border-forge-copper/30 text-forge-copper rounded-lg hover:bg-forge-copper/10 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            重新生成地图
          </button>
          <button
            onClick={exportImage}
            className="px-6 py-2 bg-white border border-forge-copper/30 text-forge-copper rounded-lg hover:bg-forge-copper/10 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            导出图片
          </button>
        </div>
      </div>

      {/* 地名列表 */}
      <div className="lg:w-80">
        <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-forge-copper/20 shadow">
          <h3 className="text-forge-copper font-fantasy text-lg mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            地名列表 ({cities.length})
          </h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton h-8 rounded w-full"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {cities.map((city, index) => (
                <div
                  key={index}
                  onMouseEnter={() => {
                    setHoveredCity(city.name);
                    setCities(prev => prev.map(c => ({
                      ...c,
                      highlighted: c.name === city.name
                    })));
                  }}
                  onMouseLeave={() => {
                    setHoveredCity(null);
                    setCities(prev => prev.map(c => ({ ...c, highlighted: false })));
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    city.highlighted
                      ? 'bg-forge-copper/20 border border-forge-copper/50'
                      : 'bg-gray-50/80 border border-transparent hover:border-forge-copper/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Map className="w-4 h-4 text-forge-copper" />
                    <span className="text-gray-700">{city.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
