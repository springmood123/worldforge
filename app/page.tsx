'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import WorldGenerator from '../components/WorldGenerator';
import MapGenerator from '../components/MapGenerator';
import InspirationRecommend from '../components/InspirationRecommend';
import { Map, BookOpen, CheckCircle2, Download, FileText, FileDown } from 'lucide-react';

interface Character {
  name: string;
  personality: string;
  quirk: string;
}

interface WorldData {
  socialCulture: string;
  customs: string;
  geography: string;
  factions: string;
  characters: Character[];
  backstory: string;
}

interface WorldHistoryItem {
  id: string;
  timestamp: Date;
  prompt: string;
  data: WorldData;
}

interface HistoricalEvent {
  title: string;
  description: string;
  similarity: string;
  application: string;
}

interface FictionalWorld {
  title: string;
  description: string;
  similarity: string;
  application: string;
}

interface PlotFragment {
  title: string;
  description: string;
  application: string;
}

interface InspirationData {
  historicalEvents: HistoricalEvent[];
  fictionalWorlds: FictionalWorld[];
  plotFragments: PlotFragment[];
}

interface InspirationHistoryItem {
  id: string;
  timestamp: Date;
  worldDescription: string;
  data: InspirationData;
}

interface TermMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TermConversation {
  id: string;
  term: string;
  messages: TermMessage[];
  timestamp: Date;
}

// 完整的历史记录数据结构
interface CompleteHistoryData {
  version: string;
  timestamp: Date;
  worldData: WorldData | null;
  worldHistory: WorldHistoryItem[];
  inspirationHistory: InspirationHistoryItem[];
  termConversations: TermConversation[];
  showMap: boolean;
  showInspiration: boolean;
}

export default function Home() {
  const [worldData, setWorldData] = useState<WorldData | null>(null);
  const [worldHistory, setWorldHistory] = useState<WorldHistoryItem[]>([]);
  const [inspirationHistory, setInspirationHistory] = useState<InspirationHistoryItem[]>([]);
  const [termConversations, setTermConversations] = useState<TermConversation[]>([]);
  
  // 功能选项状态
  const [showMap, setShowMap] = useState(false);
  const [showInspiration, setShowInspiration] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const handleWorldGenerated = (world: WorldData) => {
    setWorldData(world);
    // 生成后重置显示状态，让用户重新选择
    setShowMap(false);
    setShowInspiration(false);
  };

  const formatWorldForExport = (): string => {
    if (!worldData) return '';
    
    let content = '';
    content += `═══════════════════════════════════════════════════════════════\n`;
    content += `                    WorldForge 世界观构建工具\n`;
    content += `═══════════════════════════════════════════════════════════════\n\n`;
    content += `📅 生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
    
    if (worldData.socialCulture) {
      content += `═══════════════════════════════════════════════════════════════\n`;
      content += `                   社会文化与阶层\n`;
      content += `═══════════════════════════════════════════════════════════════\n\n`;
      content += `${worldData.socialCulture}\n\n`;
    }
    
    if (worldData.customs) {
      content += `═══════════════════════════════════════════════════════════════\n`;
      content += `                   习俗与节日\n`;
      content += `═══════════════════════════════════════════════════════════════\n\n`;
      content += `${worldData.customs}\n\n`;
    }
    
    if (worldData.geography) {
      content += `═══════════════════════════════════════════════════════════════\n`;
      content += `                   地理与环境\n`;
      content += `═══════════════════════════════════════════════════════════════\n\n`;
      content += `${worldData.geography}\n\n`;
    }
    
    if (worldData.factions) {
      content += `═══════════════════════════════════════════════════════════════\n`;
      content += `                   核心势力与冲突\n`;
      content += `═══════════════════════════════════════════════════════════════\n\n`;
      content += `${worldData.factions}\n\n`;
    }
    
    if (worldData.characters && worldData.characters.length > 0) {
      content += `═══════════════════════════════════════════════════════════════\n`;
      content += `                   角色示例\n`;
      content += `═══════════════════════════════════════════════════════════════\n\n`;
      worldData.characters.forEach((char, index) => {
        content += `【${index + 1}】${char.name}\n`;
        content += `性格: ${char.personality}\n`;
        content += `特点: ${char.quirk}\n\n`;
      });
    }
    
    if (worldData.backstory) {
      content += `═══════════════════════════════════════════════════════════════\n`;
      content += `                   背景故事\n`;
      content += `═══════════════════════════════════════════════════════════════\n\n`;
      content += `${worldData.backstory}\n\n`;
    }
    
    if (inspirationHistory && inspirationHistory.length > 0) {
      content += `═══════════════════════════════════════════════════════════════\n`;
      content += `                   灵感推荐记录\n`;
      content += `═══════════════════════════════════════════════════════════════\n\n`;
      let inspIndex = 1;
      inspirationHistory.forEach((item) => {
        if (item.data.historicalEvents && item.data.historicalEvents.length > 0) {
          item.data.historicalEvents.forEach((event) => {
            content += `【${inspIndex}】${event.title}\n`;
            content += `类型: 历史事件\n`;
            content += `描述: ${event.description.substring(0, 200)}${event.description.length > 200 ? '...' : ''}\n`;
            if (event.similarity) {
              content += `相似点: ${event.similarity}\n`;
            }
            content += `───────────────────────────────────────────────────────────────\n\n`;
            inspIndex++;
          });
        }
        if (item.data.fictionalWorlds && item.data.fictionalWorlds.length > 0) {
          item.data.fictionalWorlds.forEach((world) => {
            content += `【${inspIndex}】${world.title}\n`;
            content += `类型: 架空世界\n`;
            content += `描述: ${world.description.substring(0, 200)}${world.description.length > 200 ? '...' : ''}\n`;
            if (world.similarity) {
              content += `相似点: ${world.similarity}\n`;
            }
            content += `───────────────────────────────────────────────────────────────\n\n`;
            inspIndex++;
          });
        }
        if (item.data.plotFragments && item.data.plotFragments.length > 0) {
          item.data.plotFragments.forEach((fragment) => {
            content += `【${inspIndex}】${fragment.title}\n`;
            content += `类型: 情节片段\n`;
            content += `描述: ${fragment.description.substring(0, 200)}${fragment.description.length > 200 ? '...' : ''}\n`;
            if (fragment.application) {
              content += `应用: ${fragment.application}\n`;
            }
            content += `───────────────────────────────────────────────────────────────\n\n`;
            inspIndex++;
          });
        }
      });
    }
    
    content += `═══════════════════════════════════════════════════════════════\n`;
    content += `                    WorldForge 世界观构建工具\n`;
    content += `═══════════════════════════════════════════════════════════════\n`;
    
    return content;
  };

  const exportAsTxt = () => {
    const content = formatWorldForExport();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const worldName = worldData?.socialCulture?.substring(0, 20) || '世界观';
    link.download = `WorldForge_${worldName}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportOptions(false);
  };

  const exportAsHtml = () => {
    if (!worldData) return;
    
    const worldName = worldData.socialCulture?.substring(0, 20) || '世界观';
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WorldForge - ${worldName}</title>
  <style>
    body { font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif; max-width: 1000px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #fef9f3 0%, #f5f0e6 100%); }
    .header { background: linear-gradient(135deg, #b87333 0%, #d4af37 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px; box-shadow: 0 8px 32px rgba(184, 115, 51, 0.3); }
    .header h1 { font-size: 2.5em; margin: 0; font-weight: 300; letter-spacing: 4px; }
    .header p { margin-top: 10px; opacity: 0.9; }
    .section { background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 4px solid #b87333; }
    .section-title { color: #b87333; font-size: 1.4em; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #f0e6d2; }
    .section-content { color: #333; line-height: 1.8; font-size: 1.05em; }
    .character-item { background: #faf8f5; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
    .character-name { color: #b87333; font-weight: bold; }
    .inspiration-item { background: #faf8f5; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
    .inspiration-title { color: #b87333; font-weight: bold; }
    .inspiration-type { color: #888; font-size: 0.9em; margin-left: 10px; }
    .footer { text-align: center; color: #888; padding: 20px; font-size: 0.9em; border-top: 1px solid #eee; }
    .meta-info { background: #faf8f5; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>WorldForge</h1>
    <p>世界观构建工具</p>
  </div>
  
  <div class="meta-info">
    📅 ${new Date().toLocaleString('zh-CN')}
  </div>

  ${worldData.socialCulture ? `
  <div class="section">
    <h2 class="section-title">👥 社会文化与阶层</h2>
    <div class="section-content">${worldData.socialCulture}</div>
  </div>
  ` : ''}

  ${worldData.customs ? `
  <div class="section">
    <h2 class="section-title">🎉 习俗与节日</h2>
    <div class="section-content">${worldData.customs}</div>
  </div>
  ` : ''}

  ${worldData.geography ? `
  <div class="section">
    <h2 class="section-title">🌍 地理与环境</h2>
    <div class="section-content">${worldData.geography}</div>
  </div>
  ` : ''}

  ${worldData.factions ? `
  <div class="section">
    <h2 class="section-title">⚔️ 核心势力与冲突</h2>
    <div class="section-content">${worldData.factions}</div>
  </div>
  ` : ''}

  ${worldData.characters && worldData.characters.length > 0 ? `
  <div class="section">
    <h2 class="section-title">👤 角色示例</h2>
    <div class="section-content">
      ${worldData.characters.map((char, index) => `
        <div class="character-item">
          <div><span class="character-name">【${index + 1}】${char.name}</span></div>
          <div style="margin-top: 5px;"><strong>性格：</strong>${char.personality}</div>
          <div style="margin-top: 3px;"><strong>特点：</strong>${char.quirk}</div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${worldData.backstory ? `
  <div class="section">
    <h2 class="section-title">📜 背景故事</h2>
    <div class="section-content">${worldData.backstory}</div>
  </div>
  ` : ''}

  ${inspirationHistory && inspirationHistory.length > 0 ? `
  <div class="section">
    <h2 class="section-title">💡 灵感推荐记录</h2>
    <div class="section-content">
      ${(() => {
        const items: string[] = [];
        let index = 1;
        inspirationHistory.forEach((item) => {
          if (item.data.historicalEvents) {
            item.data.historicalEvents.forEach((event) => {
              items.push(`
                <div class="inspiration-item">
                  <div><span class="inspiration-title">【${index}】${event.title}</span><span class="inspiration-type">历史事件</span></div>
                  <div style="margin-top: 10px;">${event.description.substring(0, 300)}${event.description.length > 300 ? '...' : ''}</div>
                  ${event.similarity ? `<div style="margin-top: 8px; color: #2d7d46; font-size: 0.9em;">🔗 ${event.similarity}</div>` : ''}
                </div>
              `);
              index++;
            });
          }
          if (item.data.fictionalWorlds) {
            item.data.fictionalWorlds.forEach((world) => {
              items.push(`
                <div class="inspiration-item">
                  <div><span class="inspiration-title">【${index}】${world.title}</span><span class="inspiration-type">架空世界</span></div>
                  <div style="margin-top: 10px;">${world.description.substring(0, 300)}${world.description.length > 300 ? '...' : ''}</div>
                  ${world.similarity ? `<div style="margin-top: 8px; color: #2d7d46; font-size: 0.9em;">🔗 ${world.similarity}</div>` : ''}
                </div>
              `);
              index++;
            });
          }
          if (item.data.plotFragments) {
            item.data.plotFragments.forEach((fragment) => {
              items.push(`
                <div class="inspiration-item">
                  <div><span class="inspiration-title">【${index}】${fragment.title}</span><span class="inspiration-type">情节片段</span></div>
                  <div style="margin-top: 10px;">${fragment.description.substring(0, 300)}${fragment.description.length > 300 ? '...' : ''}</div>
                  ${fragment.application ? `<div style="margin-top: 8px; color: #2d7d46; font-size: 0.9em;">🔗 ${fragment.application}</div>` : ''}
                </div>
              `);
              index++;
            });
          }
        });
        return items.join('');
      })()}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>WorldForge - 灵感激荡 | 一站式架空世界观构建平台</p>
  </div>
</body>
</html>
    `.trim();

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WorldForge_${worldName}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportOptions(false);
  };

  const exportAsMarkdown = () => {
    if (!worldData) return;
    
    let content = '';
    const worldName = worldData.socialCulture?.substring(0, 20) || '世界观';
    
    content += `# WorldForge - ${worldName}\n\n`;
    content += `---\n\n`;
    content += `> 📅 ${new Date().toLocaleString('zh-CN')}\n\n`;
    content += `---\n\n`;
    
    if (worldData.socialCulture) {
      content += `## 👥 社会文化与阶层\n\n`;
      content += `${worldData.socialCulture}\n\n`;
    }
    
    if (worldData.customs) {
      content += `---\n\n`;
      content += `## 🎉 习俗与节日\n\n`;
      content += `${worldData.customs}\n\n`;
    }
    
    if (worldData.geography) {
      content += `---\n\n`;
      content += `## 🌍 地理与环境\n\n`;
      content += `${worldData.geography}\n\n`;
    }
    
    if (worldData.factions) {
      content += `---\n\n`;
      content += `## ⚔️ 核心势力与冲突\n\n`;
      content += `${worldData.factions}\n\n`;
    }
    
    if (worldData.characters && worldData.characters.length > 0) {
      content += `---\n\n`;
      content += `## 👤 角色示例\n\n`;
      worldData.characters.forEach((char, index) => {
        content += `### 【${index + 1}】${char.name}\n\n`;
        content += `**性格**: ${char.personality}\n\n`;
        content += `**特点**: ${char.quirk}\n\n`;
      });
    }
    
    if (worldData.backstory) {
      content += `---\n\n`;
      content += `## 📜 背景故事\n\n`;
      content += `${worldData.backstory}\n\n`;
    }
    
    if (inspirationHistory && inspirationHistory.length > 0) {
      content += `---\n\n`;
      content += `## 💡 灵感推荐记录\n\n`;
      let inspIndex = 1;
      inspirationHistory.forEach((item) => {
        if (item.data.historicalEvents && item.data.historicalEvents.length > 0) {
          item.data.historicalEvents.forEach((event) => {
            content += `### 【${inspIndex}】${event.title}\n\n`;
            content += `**类型**: 历史事件\n\n`;
            content += `${event.description.substring(0, 300)}${event.description.length > 300 ? '...' : ''}\n\n`;
            if (event.similarity) {
              content += `> 🔗 ${event.similarity}\n\n`;
            }
            inspIndex++;
          });
        }
        if (item.data.fictionalWorlds && item.data.fictionalWorlds.length > 0) {
          item.data.fictionalWorlds.forEach((world) => {
            content += `### 【${inspIndex}】${world.title}\n\n`;
            content += `**类型**: 架空世界\n\n`;
            content += `${world.description.substring(0, 300)}${world.description.length > 300 ? '...' : ''}\n\n`;
            if (world.similarity) {
              content += `> 🔗 ${world.similarity}\n\n`;
            }
            inspIndex++;
          });
        }
        if (item.data.plotFragments && item.data.plotFragments.length > 0) {
          item.data.plotFragments.forEach((fragment) => {
            content += `### 【${inspIndex}】${fragment.title}\n\n`;
            content += `**类型**: 情节片段\n\n`;
            content += `${fragment.description.substring(0, 300)}${fragment.description.length > 300 ? '...' : ''}\n\n`;
            if (fragment.application) {
              content += `> 🔗 ${fragment.application}\n\n`;
            }
            inspIndex++;
          });
        }
      });
    }
    
    content += `---\n\n`;
    content += `*WorldForge - 灵感激荡 | 一站式架空世界观构建平台*\n`;
    
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WorldForge_${worldName}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportOptions(false);
  };

  const getWorldDescription = () => {
    if (!worldData) return '请先生成一个世界观';
    return `${worldData.socialCulture}\n${worldData.geography}\n${worldData.factions}\n${worldData.backstory}`;
  };

  const handleToggleMap = () => {
    setShowMap(!showMap);
  };

  const handleToggleInspiration = () => {
    setShowInspiration(!showInspiration);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-fantasy text-forge-copper mb-2">世界观核心生成</h2>
          <p className="text-gray-600">输入你的灵感，生成完整的架空世界观设定</p>
          
          {/* 功能说明 */}
          <div className="mt-4 text-sm bg-white/80 border border-forge-copper/20 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="mb-2 font-semibold text-forge-copper">🎯 功能说明</p>
            <ul className="text-left space-y-1 text-xs text-gray-600">
              <li>• <span className="text-forge-copper">输入灵感</span>：在文本框中输入你的世界观主题、关键词或灵感（如：蒸汽朋克、浮空岛）</li>
              <li>• <span className="text-forge-copper">生成世界</span>：点击按钮，AI将为你构建完整的世界观设定</li>
              <li>• <span className="text-forge-copper">查看结果</span>：包含社会文化、习俗节日、地理环境、核心势力、角色示例和背景故事</li>
              <li>• <span className="text-forge-copper">扩展功能</span>：生成世界观后，可选择生成幻想地图和获取灵感推荐</li>
              <li>• <span className="text-forge-copper">导出记录</span>：在追问功能中可以导出会话记录到本地</li>
            </ul>
          </div>
        </div>



        {/* 内容区域 */}
        <div className="transition-opacity duration-300">
          {/* 世界观生成器 */}
          <WorldGenerator 
            onWorldGenerated={handleWorldGenerated}
            history={worldHistory}
            onHistoryChange={setWorldHistory}
            initialTermConversations={termConversations}
            onTermConversationsChange={setTermConversations}
          />

          {/* 世界观生成后的功能选择 */}
          {worldData && (
            <div className="mt-8">
              <div className="bg-[#c56216]/30 rounded-xl p-6 border border-forge-copper/30">
                <h3 className="text-forge-copper font-fantasy text-lg mb-4 text-center">✨ 扩展功能</h3>
                <p className="text-gray-600 text-sm text-center mb-6">世界观已生成，选择你想要的扩展功能：</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 幻想地图选项 */}
                  <button
                    onClick={handleToggleMap}
                    className={`p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                      showMap 
                        ? 'bg-forge-copper/20 border-forge-copper text-forge-copper' 
                        : 'bg-white/80 border-gray-300 text-gray-700 hover:border-forge-copper/50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      showMap ? 'bg-forge-copper text-white' : 'bg-gray-200'
                    }`}>
                      {showMap ? <CheckCircle2 className="w-6 h-6" /> : <Map className="w-6 h-6" />}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{showMap ? '✓ 已启用' : '生成幻想地图'}</div>
                      <div className="text-xs opacity-70">基于世界观生成随机地图，自动命名城市</div>
                    </div>
                  </button>

                  {/* 灵感推荐选项 */}
                  <button
                    onClick={handleToggleInspiration}
                    className={`p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                      showInspiration 
                        ? 'bg-forge-copper/20 border-forge-copper text-forge-copper' 
                        : 'bg-white/80 border-gray-300 text-gray-700 hover:border-forge-copper/50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      showInspiration ? 'bg-forge-copper text-white' : 'bg-gray-200'
                    }`}>
                      {showInspiration ? <CheckCircle2 className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{showInspiration ? '✓ 已启用' : '获取灵感推荐'}</div>
                      <div className="text-xs opacity-70">推荐历史事件、架空世界和情节片段</div>
                    </div>
                  </button>
                </div>

                {/* 导出全部内容区域 */}
                <div className="mt-6">
                  <button
                    onClick={() => setShowExportOptions(!showExportOptions)}
                    className="w-full py-3 bg-gradient-to-r from-forge-copper to-forge-gold text-white rounded-lg transition-all flex items-center justify-center gap-2 hover:from-forge-gold hover:to-forge-copper shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    导出全部内容
                  </button>
                  
                  {showExportOptions && (
                    <div className="mt-3 bg-white border border-forge-copper/30 rounded-lg p-4 shadow-lg">
                      <div className="text-forge-copper font-semibold mb-3 flex items-center gap-2">
                        <FileDown className="w-5 h-5" />
                        选择导出格式
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={exportAsTxt}
                          className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-forge-copper/10 border border-gray-200 hover:border-forge-copper/50 rounded-lg transition-all"
                        >
                          <FileText className="w-6 h-6 text-forge-copper" />
                          <span className="text-sm text-gray-700">TXT 文档</span>
                          <span className="text-xs text-gray-500">纯文本格式</span>
                        </button>
                        <button
                          onClick={exportAsHtml}
                          className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-forge-copper/10 border border-gray-200 hover:border-forge-copper/50 rounded-lg transition-all"
                        >
                          <FileText className="w-6 h-6 text-forge-copper" />
                          <span className="text-sm text-gray-700">HTML 文档</span>
                          <span className="text-xs text-gray-500">美观网页格式</span>
                        </button>
                        <button
                          onClick={exportAsMarkdown}
                          className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-forge-copper/10 border border-gray-200 hover:border-forge-copper/50 rounded-lg transition-all"
                        >
                          <FileText className="w-6 h-6 text-forge-copper" />
                          <span className="text-sm text-gray-700">Markdown</span>
                          <span className="text-xs text-gray-500">通用格式</span>
                        </button>
                      </div>
                      <div className="mt-3 text-xs text-gray-500 text-center">
                        文件将保存到您的下载文件夹，包含所有世界观内容和灵感推荐
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 幻想地图区域 */}
              {showMap && (
                <div className="mt-8">
                  <div className="bg-white/80 rounded-xl p-4 border border-forge-copper/20">
                    <h3 className="text-forge-copper font-fantasy text-lg mb-4 flex items-center gap-2">
                      <Map className="w-5 h-5" />
                      幻想地图生成器
                    </h3>
                    <MapGenerator worldTheme={worldData.socialCulture || '奇幻世界'} />
                  </div>
                </div>
              )}

              {/* 灵感推荐区域 */}
              {showInspiration && (
                <div className="mt-8">
                  <div className="bg-white/80 rounded-xl p-4 border border-forge-copper/20">
                    <h3 className="text-forge-copper font-fantasy text-lg mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      历史与架空灵感推荐
                    </h3>
                    <InspirationRecommend 
                      worldDescription={getWorldDescription()}
                      history={inspirationHistory}
                      onHistoryChange={setInspirationHistory}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-gray-200 mt-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>WorldForge - 灵感激荡 | 一站式架空世界观构建平台</p>
          <p className="mt-1">使用 智谱AI API 驱动创意生成</p>
        </div>
      </footer>
    </div>
  );
}
