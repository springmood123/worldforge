'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import WorldGenerator from '../components/WorldGenerator';
import MapGenerator from '../components/MapGenerator';
import InspirationRecommend from '../components/InspirationRecommend';
import { Map, BookOpen, CheckCircle2, Save, Download, History, Copy, Check } from 'lucide-react';

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
  
  // 历史记录存储相关状态
  const [historyId, setHistoryId] = useState('');
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // 生成唯一的历史记录ID
  const generateHistoryId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `WF-${timestamp}-${random}`;
  };

  // 保存当前会话历史
  const saveCurrentHistory = () => {
    if (!worldData) {
      alert('请先生成一个世界观！');
      return;
    }

    const newId = generateHistoryId();
    const historyData: CompleteHistoryData = {
      version: '1.0',
      timestamp: new Date(),
      worldData,
      worldHistory,
      inspirationHistory,
      termConversations,
      showMap,
      showInspiration
    };

    try {
      localStorage.setItem(`worldforge-${newId}`, JSON.stringify(historyData));
      setCurrentHistoryId(newId);
      setHistoryId(newId);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (error) {
      console.error('保存历史记录失败:', error);
      alert('保存失败，请重试！');
    }
  };

  // 加载历史记录
  const loadHistory = () => {
    if (!historyId.trim()) {
      alert('请输入历史记录ID！');
      return;
    }

    setIsLoadingHistory(true);
    
    try {
      const storedData = localStorage.getItem(`worldforge-${historyId.trim()}`);
      
      if (!storedData) {
        alert('未找到对应的历史记录！');
        return;
      }

      const historyData: CompleteHistoryData = JSON.parse(storedData);
      
      // 恢复数据
      setWorldData(historyData.worldData);
      setWorldHistory(historyData.worldHistory.map(item => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
      setInspirationHistory(historyData.inspirationHistory.map(item => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
      setTermConversations(historyData.termConversations.map(conv => ({
        ...conv,
        timestamp: new Date(conv.timestamp),
        messages: conv.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      })));
      setShowMap(historyData.showMap);
      setShowInspiration(historyData.showInspiration);
      setCurrentHistoryId(historyId.trim());
      
      alert('历史记录加载成功！');
    } catch (error) {
      console.error('加载历史记录失败:', error);
      alert('加载失败，请检查ID是否正确！');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 复制当前ID到剪贴板
  const copyHistoryId = async () => {
    if (!currentHistoryId) return;
    
    try {
      await navigator.clipboard.writeText(currentHistoryId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleWorldGenerated = (world: WorldData) => {
    setWorldData(world);
    // 生成后重置显示状态，让用户重新选择
    setShowMap(false);
    setShowInspiration(false);
    // 生成新世界观时清除旧的历史记录ID
    setCurrentHistoryId(null);
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
          <h2 className="text-3xl font-fantasy text-forge-copper mb-2">世界观核心生成 v2</h2>
          <p className="text-gray-600">输入你的灵感，生成完整的架空世界观设定</p>
          
          {/* 功能说明 */}
          <div className="mt-4 text-sm bg-white/80 border border-forge-copper/20 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="mb-2 font-semibold text-forge-copper">🎯 功能说明</p>
            <ul className="text-left space-y-1 text-xs text-gray-600">
              <li>• <span className="text-forge-copper">输入灵感</span>：在文本框中输入你的世界观主题、关键词或灵感（如：蒸汽朋克、浮空岛）</li>
              <li>• <span className="text-forge-copper">生成世界</span>：点击按钮，AI将为你构建完整的世界观设定</li>
              <li>• <span className="text-forge-copper">查看结果</span>：包含社会文化、习俗节日、地理环境、核心势力、角色示例和背景故事</li>
              <li>• <span className="text-forge-copper">扩展功能</span>：生成世界观后，可选择生成幻想地图和获取灵感推荐</li>
              <li>• <span className="text-forge-copper">历史记录</span>：所有生成的内容都会自动保存，方便随时查看</li>
            </ul>
          </div>
        </div>

        {/* 历史记录存储和检索区域 */}
        <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-forge-copper/20 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-4">
            <History className="w-5 h-5 text-forge-copper" />
            <h3 className="text-forge-copper text-lg font-fantasy">历史记录管理</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 保存当前会话 */}
            <div className="bg-gray-100/50 rounded-lg p-4">
              <h4 className="text-forge-copper font-semibold text-sm mb-3 flex items-center gap-2">
                <Save className="w-4 h-4" />
                保存当前会话
              </h4>
              {currentHistoryId ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-gray-200/50 rounded-lg">
                    <span className="text-gray-600 text-sm">会话ID：</span>
                    <code className="flex-1 bg-gray-300/50 px-2 py-1 rounded text-forge-copper text-sm font-mono">
                      {currentHistoryId}
                    </code>
                    <button
                      onClick={copyHistoryId}
                      className="p-1.5 hover:bg-forge-copper/20 rounded transition-colors text-forge-copper"
                      title="复制ID"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  {showSaveSuccess && (
                    <div className="text-green-500 text-sm flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      保存成功！
                    </div>
                  )}
                  <button
                    onClick={saveCurrentHistory}
                    className="w-full py-2 bg-forge-copper/30 hover:bg-forge-copper/50 text-forge-copper rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    更新保存
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm">
                    生成世界观后，可以保存当前会话以便下次继续
                  </p>
                  <button
                    onClick={saveCurrentHistory}
                    disabled={!worldData}
                    className="w-full py-2 bg-gradient-to-r from-forge-copper to-forge-gold disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 hover:from-forge-gold hover:to-forge-copper"
                  >
                    <Save className="w-4 h-4" />
                    保存当前会话
                  </button>
                </div>
              )}
            </div>
            
            {/* 加载历史会话 */}
            <div className="bg-forge-dark-700/30 rounded-lg p-4">
              <h4 className="text-forge-gold font-semibold text-sm mb-3 flex items-center gap-2">
                <Download className="w-4 h-4" />
                加载历史会话
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-light-400 text-sm block mb-1">输入会话ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={historyId}
                      onChange={(e) => setHistoryId(e.target.value)}
                      placeholder="例如：WF-abc123-xyz..."
                      className="flex-1 bg-forge-dark-600/50 border border-forge-copper/30 rounded-lg px-3 py-2 text-light-200 placeholder-light-500 focus:outline-none focus:border-forge-copper/50 text-sm"
                    />
                    <button
                      onClick={loadHistory}
                      disabled={isLoadingHistory || !historyId.trim()}
                      className="px-4 py-2 bg-forge-gold hover:bg-forge-gold/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {isLoadingHistory ? <Download className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      加载
                    </button>
                  </div>
                </div>
                <p className="text-light-500 text-xs">
                  提示：输入之前保存的会话ID即可恢复完整的会话历史
                </p>
              </div>
            </div>
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
          {worldData && !isLoadingHistory && (
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
