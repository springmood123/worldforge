'use client';

import { useState } from 'react';
import { BookOpen, History, Sparkles, ChevronDown, ChevronUp, BookMarked, Clock, Trash2, Settings, RefreshCcw, Shuffle, MessageSquare } from 'lucide-react';
import InspirationQuestioner from './InspirationQuestioner';

interface HistoricalEvent {
  title: string;
  description: string;
  similarity: string;
  application: string;
  worldConnection?: string;
}

interface FictionalWorld {
  title: string;
  description: string;
  similarity: string;
  application: string;
  worldConnection?: string;
}

interface PlotFragment {
  title: string;
  description: string;
  application: string;
  worldConnection?: string;
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

interface InspirationRecommendProps {
  worldDescription: string;
  history: InspirationHistoryItem[];
  onHistoryChange: (history: InspirationHistoryItem[]) => void;
}

interface AccordionItemProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

interface QuestionState {
  type: 'historicalEvent' | 'fictionalWorld' | 'plotFragment';
  title: string;
  data: any;
}

function AccordionItem({ title, icon, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white/80 backdrop-blur rounded-xl p-4 mb-4 border border-gray-200 shadow">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-forge-copper">{icon}</span>
          <span className="text-forge-copper font-semibold text-lg">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-forge-copper" />
        ) : (
          <ChevronDown className="w-5 h-5 text-forge-copper" />
        )}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[3000px] mt-4' : 'max-h-0'}`}>
        {children}
      </div>
    </div>
  );
}

export default function InspirationRecommend({ worldDescription, history, onHistoryChange }: InspirationRecommendProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InspirationData | null>(null);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [diversityLevel, setDiversityLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [avoidedTitles, setAvoidedTitles] = useState<string[]>([]);
  const [questionState, setQuestionState] = useState<QuestionState | null>(null);

  const fetchInspiration = async () => {
    if (!worldDescription) {
      setError('请先生成一个世界观');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/recommend-inspiration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          worldDescription,
          diversityLevel,
          avoidContent: avoidedTitles 
        }),
      });

      if (!response.ok) {
        throw new Error('API请求失败');
      }

      const result = await response.json();
      setData(result);
      
      // 将新内容加入避免列表
      const newTitles = [
        ...result.historicalEvents.map((e: any) => e.title),
        ...result.fictionalWorlds.map((w: any) => w.title),
        ...result.plotFragments.map((f: any) => f.title)
      ];
      setAvoidedTitles(prev => [...prev, ...newTitles].slice(-30)); // 保留最近30个
      
      // 添加到历史记录
      const newHistoryItem: InspirationHistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date(),
        worldDescription: worldDescription,
        data: result
      };
      onHistoryChange([newHistoryItem, ...history].slice(0, 10)); // 保留最近10条
    } catch (err) {
      setError('获取灵感推荐失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (item: InspirationHistoryItem) => {
    setData(item.data);
  };

  const handleDeleteHistory = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    onHistoryChange(newHistory);
  };

  const handleClearHistory = () => {
    onHistoryChange([]);
    setAvoidedTitles([]);
    setShowHistory(false);
  };

  const renderEventCard = (event: HistoricalEvent, index: number) => (
    <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 mb-4 border border-gray-200 hover:border-forge-copper/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-forge-copper font-bold text-lg flex items-center gap-2">
          <span className="w-8 h-8 bg-forge-copper/10 rounded-full flex items-center justify-center text-forge-copper text-sm">
            {index + 1}
          </span>
          {event.title}
        </h4>
        <button
          onClick={() => setQuestionState({ type: 'historicalEvent', title: event.title, data: event })}
          className="p-2 text-forge-copper/70 hover:text-forge-copper hover:bg-forge-copper/10 rounded-lg transition-all"
          title="深入追问"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
      <p className="text-gray-700 mb-3 leading-relaxed">{event.description}</p>
      <div className="space-y-2">
        {event.similarity && (
          <div className="text-sm bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
            <span className="font-semibold text-blue-800">✨ 相似点：</span>
            <span className="text-blue-700">{event.similarity}</span>
          </div>
        )}
        {event.worldConnection && (
          <div className="text-sm bg-green-50 border-l-4 border-green-400 p-3 rounded-r">
            <span className="font-semibold text-green-800">🌍 世界观关联：</span>
            <span className="text-green-700">{event.worldConnection}</span>
          </div>
        )}
        <div className="text-sm bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r">
          <span className="font-semibold text-amber-800">💡 如何应用：</span>
          <span className="text-amber-700">{event.application}</span>
        </div>
      </div>
    </div>
  );

  const renderWorldCard = (world: FictionalWorld, index: number) => (
    <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 mb-4 border border-gray-200 hover:border-forge-copper/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-forge-copper font-bold text-lg flex items-center gap-2">
          <span className="w-8 h-8 bg-forge-copper/10 rounded-full flex items-center justify-center text-forge-copper text-sm">
            {index + 1}
          </span>
          {world.title}
        </h4>
        <button
          onClick={() => setQuestionState({ type: 'fictionalWorld', title: world.title, data: world })}
          className="p-2 text-forge-copper/70 hover:text-forge-copper hover:bg-forge-copper/10 rounded-lg transition-all"
          title="深入追问"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
      <p className="text-gray-700 mb-3 leading-relaxed">{world.description}</p>
      <div className="space-y-2">
        {world.similarity && (
          <div className="text-sm bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
            <span className="font-semibold text-blue-800">✨ 相似点：</span>
            <span className="text-blue-700">{world.similarity}</span>
          </div>
        )}
        {world.worldConnection && (
          <div className="text-sm bg-green-50 border-l-4 border-green-400 p-3 rounded-r">
            <span className="font-semibold text-green-800">🌍 世界观关联：</span>
            <span className="text-green-700">{world.worldConnection}</span>
          </div>
        )}
        <div className="text-sm bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r">
          <span className="font-semibold text-amber-800">💡 如何应用：</span>
          <span className="text-amber-700">{world.application}</span>
        </div>
      </div>
    </div>
  );

  const renderFragmentCard = (fragment: PlotFragment, index: number) => (
    <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 mb-4 border border-gray-200 hover:border-forge-copper/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-forge-copper font-bold text-lg flex items-center gap-2">
          <span className="w-8 h-8 bg-forge-copper/10 rounded-full flex items-center justify-center text-forge-copper text-sm">
            {index + 1}
          </span>
          {fragment.title}
        </h4>
        <button
          onClick={() => setQuestionState({ type: 'plotFragment', title: fragment.title, data: fragment })}
          className="p-2 text-forge-copper/70 hover:text-forge-copper hover:bg-forge-copper/10 rounded-lg transition-all"
          title="深入追问"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
      <p className="text-gray-700 mb-3 leading-relaxed">{fragment.description}</p>
      <div className="space-y-2">
        {fragment.worldConnection && (
          <div className="text-sm bg-green-50 border-l-4 border-green-400 p-3 rounded-r">
            <span className="font-semibold text-green-800">🌍 世界观关联：</span>
            <span className="text-green-700">{fragment.worldConnection}</span>
          </div>
        )}
        <div className="text-sm bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r">
          <span className="font-semibold text-amber-800">💡 如何应用：</span>
          <span className="text-amber-700">{fragment.application}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-gray-200 shadow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-forge-copper" />
              <span className="font-semibold text-gray-800">多样性设置</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDiversityLevel('low')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  diversityLevel === 'low'
                    ? 'bg-forge-copper text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                保守
              </button>
              <button
                onClick={() => setDiversityLevel('medium')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  diversityLevel === 'medium'
                    ? 'bg-forge-copper text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                平衡
              </button>
              <button
                onClick={() => setDiversityLevel('high')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  diversityLevel === 'high'
                    ? 'bg-forge-copper text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                激进
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-all ${
                showHistory
                  ? 'bg-forge-copper/20 text-forge-copper'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <History className="w-4 h-4" />
              历史记录 ({history.length})
            </button>
          </div>
        </div>
        
        {/* 说明文字 */}
        <div className="mt-4 text-sm text-gray-500">
          <p>💡 提示：保守模式确保高质量但创意方向相似；平衡模式在质量和多样性间取得平衡；激进模式探索边缘创新的可能性</p>
        </div>
      </div>

      {/* 历史记录面板 */}
      {showHistory && (
        <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-gray-200 shadow max-h-[400px] overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              暂无历史记录
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div 
                  key={item.id}
                  className="p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:border-forge-copper/30 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <Clock className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleString('zh-CN')}
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        <span className="text-forge-copper font-semibold">参考世界观：</span>
                        {item.worldDescription?.slice(0, 50)}...
                      </div>
                      <div className="text-xs text-gray-500">
                        包含 {item.data.historicalEvents?.length || 0} 个历史事件、{item.data.fictionalWorlds?.length || 0} 个架空世界、{item.data.plotFragments?.length || 0} 个情节片段
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelectHistory(item)}
                        className="px-3 py-1 text-sm bg-forge-copper/20 text-forge-copper rounded hover:bg-forge-copper/30 transition-colors"
                      >
                        查看
                      </button>
                      <button
                        onClick={() => handleDeleteHistory(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={handleClearHistory}
                className="w-full py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                清空所有历史记录
              </button>
            </div>
          )}
        </div>
      )}

      {/* 触发按钮 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button
          onClick={fetchInspiration}
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-forge-copper to-forge-gold text-white font-bold rounded-xl hover:from-forge-gold hover:to-forge-copper transition-all duration-300 btn-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg"
        >
          {loading ? (
            <>
              <RefreshCcw className="w-5 h-5 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Shuffle className="w-5 h-5" />
              推荐历史/架空灵感
            </>
          )}
        </button>
        
        {avoidedTitles.length > 0 && (
          <button
            onClick={() => setAvoidedTitles([])}
            className="px-4 py-2 text-sm text-gray-600 hover:text-forge-copper transition-colors"
          >
            重置去重列表
          </button>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-center">
          {error}
        </div>
      )}

      {/* 加载状态 */}
      {loading && !data && (
        <div className="space-y-4">
          <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-gray-200 shadow">
            <div className="skeleton h-6 w-48 rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-32 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 结果展示 */}
      {data && !loading && (
        <div className="space-y-4">
          {/* 真实历史事件 */}
          <AccordionItem
            title="真实历史事件"
            icon={<History className="w-6 h-6" />}
            defaultOpen
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.historicalEvents?.map((event, index) => renderEventCard(event, index))}
            </div>
          </AccordionItem>

          {/* 著名架空世界 */}
          <AccordionItem
            title="著名架空世界"
            icon={<BookMarked className="w-6 h-6" />}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.fictionalWorlds?.map((world, index) => renderWorldCard(world, index))}
            </div>
          </AccordionItem>

          {/* 情节片段 */}
          <AccordionItem
            title="情节与设定片段"
            icon={<Sparkles className="w-6 h-6" />}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.plotFragments?.map((fragment, index) => renderFragmentCard(fragment, index))}
            </div>
          </AccordionItem>
        </div>
      )}

      {/* 追问弹窗 */}
      {questionState && (
        <InspirationQuestioner
          inspirationType={questionState.type}
          inspirationTitle={questionState.title}
          inspirationData={questionState.data}
          worldContext={worldDescription}
          onClose={() => setQuestionState(null)}
        />
      )}
    </div>
  );
}
