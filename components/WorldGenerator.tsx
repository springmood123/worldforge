'use client';

import { useState } from 'react';
import { Sparkles, RefreshCw, Lightbulb, History, Clock, Trash2, MessageSquare, HelpCircle } from 'lucide-react';
import TermExplorer from './TermExplorer';
import SectionQuestioner from './SectionQuestioner';

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

interface WorldGeneratorProps {
  onWorldGenerated: (world: WorldData) => void;
  history: WorldHistoryItem[];
  onHistoryChange: (history: WorldHistoryItem[]) => void;
  initialTermConversations?: TermConversation[];
  onTermConversationsChange?: (conversations: TermConversation[]) => void;
}

// 从文本中提取关键词
const extractKeywords = (text: string): string[] => {
  const words = text.split(/[，。；：、！？,\.\s]+/);
  const keywords: string[] = [];
  const stopWords = ['的', '是', '在', '了', '和', '与', '或', '但', '而', '也', '都', '就', '被', '把', '让', '给', '到', '从', '向', '对', '于', '关于', '对于'];
  
  words.forEach(word => {
    if (word.length >= 2 && !stopWords.includes(word) && !keywords.includes(word)) {
      keywords.push(word);
    }
  });
  
  return keywords.slice(0, 8); // 每个段落最多8个关键词
};

// 高亮文本中的关键词
const HighlightedText = ({ text, onWordClick }: { text: string, onWordClick: (word: string) => void }) => {
  const keywords = extractKeywords(text);
  let processedText = text;
  
  // 替换关键词为可点击的span
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})`, 'g');
    processedText = processedText.replace(regex, `|||$1|||`);
  });
  
  const parts = processedText.split('|||');
  
  return (
    <p className="text-gray-700 leading-relaxed">
      {parts.map((part, index) => {
        if (keywords.includes(part)) {
          return (
            <span
              key={index}
              onClick={() => onWordClick(part)}
              className="inline-block px-1.5 py-0.5 mx-0.5 bg-forge-copper/10 text-forge-copper rounded cursor-pointer hover:bg-forge-copper/20 transition-colors border-b border-dashed border-forge-copper/50 hover:border-forge-copper"
              title="点击探索此概念"
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </p>
  );
};

export default function WorldGenerator({ 
  onWorldGenerated, 
  history, 
  onHistoryChange,
  initialTermConversations = [],
  onTermConversationsChange 
}: WorldGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [worldData, setWorldData] = useState<WorldData | null>(null);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [sectionQuestion, setSectionQuestion] = useState<{
    type: string;
    title: string;
    content: string;
  } | null>(null);

  const getWorldContext = () => {
    if (!worldData) return '';
    return `社会文化：${worldData.socialCulture}\n习俗节日：${worldData.customs}\n地理环境：${worldData.geography}\n核心势力：${worldData.factions}\n背景故事：${worldData.backstory}`;
  };

  const handleWordClick = (word: string) => {
    if (!worldData) return;
    const worldContent = `社会文化：${worldData.socialCulture}\n习俗节日：${worldData.customs}\n地理环境：${worldData.geography}\n核心势力：${worldData.factions}\n角色示例：${worldData.characters.map(c => c.name).join('、')}\n背景故事：${worldData.backstory}`;
    setSectionQuestion({ 
      type: 'term', 
      title: `探索词汇「${word}」`, 
      content: `当前探索词汇：${word}\n\n世界观上下文：\n${worldContent}` 
    });
  };

  const handleSectionQuestion = (sectionType: string, title: string, content: string) => {
    setSectionQuestion({ type: sectionType, title, content });
  };

  const generateWorld = async (additionalPrompt?: string) => {
    setLoading(true);
    setError('');
    
    const finalPrompt = additionalPrompt || prompt || '请创建一个富有想象力的架空世界观';
    
    try {
      const response = await fetch('/api/generate-world', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      if (!response.ok) {
        throw new Error('API请求失败');
      }

      const data = await response.json();
      setWorldData(data);
      onWorldGenerated(data);
      
      // 添加到历史记录
      const newHistoryItem: WorldHistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date(),
        prompt: additionalPrompt ? `基于已有世界观生成更多灵感` : prompt,
        data: data
      };
      onHistoryChange([newHistoryItem, ...history].slice(0, 10)); // 保留最近10条
    } catch (err) {
      setError('生成失败，请检查API密钥配置或稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    setWorldData(null);
    generateWorld();
  };

  const handleMoreInspiration = async () => {
    if (!worldData) return;
    
    const additionalPrompt = `基于以下世界观，生成更多创意变体：\n${worldData.socialCulture}\n${worldData.geography}\n${worldData.factions}`;
    generateWorld(additionalPrompt);
  };

  const handleSelectHistory = (item: WorldHistoryItem) => {
    setWorldData(item.data);
    setPrompt(item.prompt);
    onWorldGenerated(item.data);
  };

  const handleDeleteHistory = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    onHistoryChange(newHistory);
  };

  const handleClearHistory = () => {
    onHistoryChange([]);
    setShowHistory(false);
  };

  return (
    <div className="space-y-6">
      {/* 输入区域 */}
      <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-forge-copper/20 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <label className="text-forge-copper text-lg font-fantasy">
            世界观灵感输入
          </label>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 transition-colors ${
              showHistory 
                ? 'bg-forge-copper/20 text-forge-copper' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <History className="w-4 h-4" />
            历史记录 ({history.length})
          </button>
        </div>
        
        {/* 历史记录面板 */}
        {showHistory && (
          <div className="mb-4 bg-gray-50/80 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
            {history.length === 0 ? (
              <div className="p-4 text-gray-500 text-center text-sm">
                暂无历史记录
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 hover:bg-gray-100/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.timestamp).toLocaleString('zh-CN')}
                        </div>
                        <div className="text-sm text-gray-700 truncate">
                          {item.prompt || '随机生成'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleSelectHistory(item)}
                          className="px-2 py-1 text-xs bg-forge-copper/20 text-forge-copper rounded hover:bg-forge-copper/30"
                        >
                          查看
                        </button>
                        <button
                          onClick={() => handleDeleteHistory(item.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {history.length > 0 && (
              <div className="p-2 border-t border-gray-200">
                <button
                  onClick={handleClearHistory}
                  className="w-full text-sm text-red-500 hover:bg-red-50 py-1 rounded transition-colors"
                >
                  清空所有历史记录
                </button>
              </div>
            )}
          </div>
        )}
        
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="请输入你的世界观主题、核心灵感或关键词...&#10;&#10;例如：蒸汽朋克沙漠、浮空岛、魔法与科技共存、古老文明遗迹、机械生命体"
          className="w-full h-36 p-4 bg-gray-100/80 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-forge-copper/50 resize-none transition-colors"
        />
        <button
          onClick={() => generateWorld()}
          disabled={loading}
          className="mt-4 w-full py-4 bg-gradient-to-r from-forge-copper to-forge-gold text-white font-bold text-lg rounded-lg hover:from-forge-gold hover:to-forge-copper transition-all duration-300 btn-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          {loading ? '生成中...' : '生成世界观'}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* 加载骨架屏 */}
      {loading && !worldData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/80 rounded-xl p-6 border border-forge-copper/20 shadow">
              <div className="skeleton h-6 w-32 rounded mb-4"></div>
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="skeleton h-4 rounded w-full"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 生成结果 */}
      {worldData && !loading && (
        <div className="space-y-6">
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={handleRegenerate}
              className="px-6 py-2 bg-white border border-forge-copper/30 text-forge-copper rounded-lg hover:bg-forge-copper/10 transition-colors flex items-center gap-2 shadow"
            >
              <RefreshCw className="w-4 h-4" />
              重新生成
            </button>
            <button
              onClick={handleMoreInspiration}
              className="px-6 py-2 bg-white border border-forge-copper/30 text-forge-copper rounded-lg hover:bg-forge-copper/10 transition-colors flex items-center gap-2 shadow"
            >
              <Lightbulb className="w-4 h-4" />
              更多灵感
            </button>
            <button
              onClick={() => setShowExplorer(true)}
              className="px-6 py-2 bg-white border border-forge-copper/30 text-forge-copper rounded-lg hover:bg-forge-copper/10 transition-colors flex items-center gap-2 shadow"
            >
              <MessageSquare className="w-4 h-4" />
              词汇探索
            </button>
          </div>

          {/* 使用提示 */}
          <div className="bg-forge-copper/10 border border-forge-copper/20 rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-forge-copper/20 rounded-full flex items-center justify-center text-forge-copper">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-forge-copper font-semibold">💡 提示</div>
              <div className="text-gray-600 text-sm">点击下方内容中高亮显示的词汇，即可开始深入探索！</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 社会文化与阶层 */}
            <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-forge-copper/20 card-hover shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-forge-copper font-fantasy text-lg flex items-center gap-2">
                  <span className="w-8 h-8 bg-forge-copper/20 rounded-full flex items-center justify-center text-sm">1</span>
                  社会文化与阶层
                </h3>
                <button
                  onClick={() => handleSectionQuestion('socialCulture', '社会文化与阶层', worldData.socialCulture)}
                  className="w-8 h-8 rounded-full bg-forge-copper/10 hover:bg-forge-copper/20 flex items-center justify-center text-forge-copper hover:text-forge-gold transition-all"
                  title="追问此板块"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <HighlightedText text={worldData.socialCulture} onWordClick={handleWordClick} />
            </div>

            {/* 独特习俗与节日 */}
            <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-forge-copper/20 card-hover shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-forge-copper font-fantasy text-lg flex items-center gap-2">
                  <span className="w-8 h-8 bg-forge-copper/20 rounded-full flex items-center justify-center text-sm">2</span>
                  独特习俗与节日
                </h3>
                <button
                  onClick={() => handleSectionQuestion('customs', '独特习俗与节日', worldData.customs)}
                  className="w-8 h-8 rounded-full bg-forge-copper/10 hover:bg-forge-copper/20 flex items-center justify-center text-forge-copper hover:text-forge-gold transition-all"
                  title="追问此板块"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <HighlightedText text={worldData.customs} onWordClick={handleWordClick} />
            </div>

            {/* 地理环境与气候 */}
            <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-forge-copper/20 card-hover shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-forge-copper font-fantasy text-lg flex items-center gap-2">
                  <span className="w-8 h-8 bg-forge-copper/20 rounded-full flex items-center justify-center text-sm">3</span>
                  地理环境与气候
                </h3>
                <button
                  onClick={() => handleSectionQuestion('geography', '地理环境与气候', worldData.geography)}
                  className="w-8 h-8 rounded-full bg-forge-copper/10 hover:bg-forge-copper/20 flex items-center justify-center text-forge-copper hover:text-forge-gold transition-all"
                  title="追问此板块"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <HighlightedText text={worldData.geography} onWordClick={handleWordClick} />
            </div>

            {/* 核心势力/种族 */}
            <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-forge-copper/20 card-hover shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-forge-copper font-fantasy text-lg flex items-center gap-2">
                  <span className="w-8 h-8 bg-forge-copper/20 rounded-full flex items-center justify-center text-sm">4</span>
                  核心势力/种族
                </h3>
                <button
                  onClick={() => handleSectionQuestion('factions', '核心势力/种族', worldData.factions)}
                  className="w-8 h-8 rounded-full bg-forge-copper/10 hover:bg-forge-copper/20 flex items-center justify-center text-forge-copper hover:text-forge-gold transition-all"
                  title="追问此板块"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <HighlightedText text={worldData.factions} onWordClick={handleWordClick} />
            </div>

            {/* 角色示例 */}
            <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-forge-copper/20 card-hover shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-forge-copper font-fantasy text-lg flex items-center gap-2">
                  <span className="w-8 h-8 bg-forge-copper/20 rounded-full flex items-center justify-center text-sm">5</span>
                  角色示例
                </h3>
                <button
                  onClick={() => {
                    const charactersText = worldData.characters.map(c => 
                      `角色：${c.name}，性格：${c.personality}，怪癖：${c.quirk}`
                    ).join('\n');
                    handleSectionQuestion('characters', '角色示例', charactersText);
                  }}
                  className="w-8 h-8 rounded-full bg-forge-copper/10 hover:bg-forge-copper/20 flex items-center justify-center text-forge-copper hover:text-forge-gold transition-all"
                  title="追问此板块"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {worldData.characters?.map((char, index) => (
                  <div key={index} className="bg-gray-50/80 rounded-lg p-3">
                    <div 
                      className="text-forge-copper font-semibold cursor-pointer hover:text-forge-gold inline-block"
                      onClick={() => handleWordClick(char.name)}
                    >
                      {char.name}
                    </div>
                    <div className="text-gray-600 text-sm mt-1">
                      <HighlightedText text={char.personality} onWordClick={handleWordClick} />
                    </div>
                    <div className="text-gray-500 text-xs mt-1">怪癖：{char.quirk}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 核心背景故事 */}
            <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-forge-copper/20 card-hover shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-forge-copper font-fantasy text-lg flex items-center gap-2">
                  <span className="w-8 h-8 bg-forge-copper/20 rounded-full flex items-center justify-center text-sm">6</span>
                  核心背景故事
                </h3>
                <button
                  onClick={() => handleSectionQuestion('backstory', '核心背景故事', worldData.backstory)}
                  className="w-8 h-8 rounded-full bg-forge-copper/10 hover:bg-forge-copper/20 flex items-center justify-center text-forge-copper hover:text-forge-gold transition-all"
                  title="追问此板块"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <HighlightedText text={worldData.backstory} onWordClick={handleWordClick} />
            </div>
          </div>
        </div>
      )}

      {/* 词汇探索弹窗 */}
      {showExplorer && (
        <TermExplorer
          worldContext={getWorldContext()}
          initialTerm={selectedTerm}
          initialConversations={initialTermConversations}
          onConversationsChange={onTermConversationsChange}
          onClose={() => {
            setShowExplorer(false);
            setSelectedTerm('');
          }}
        />
      )}

      {/* 板块追问弹窗 */}
      {sectionQuestion && (
        <SectionQuestioner
          sectionType={sectionQuestion.type}
          sectionTitle={sectionQuestion.title}
          sectionContent={sectionQuestion.content}
          worldContext={getWorldContext()}
          onClose={() => setSectionQuestion(null)}
        />
      )}
    </div>
  );
}
