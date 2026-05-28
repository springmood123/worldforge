'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Sparkles, BookOpen, History, Sparkles as SparklesIcon } from 'lucide-react';

interface InspirationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface InspirationQuestionerProps {
  inspirationType: 'historicalEvent' | 'fictionalWorld' | 'plotFragment';
  inspirationTitle: string;
  inspirationData: any;
  worldContext: string;
  onClose: () => void;
}

const INSPIRATION_TYPE_NAMES: Record<string, string> = {
  historicalEvent: '真实历史事件',
  fictionalWorld: '著名架空世界',
  plotFragment: '情节与设定片段'
};

const INSPIRATION_QUICK_QUESTIONS = [
  '请详细展开这个灵感',
  '可以举更多具体例子吗？',
  '如何将这个灵感与我的世界观深度结合？',
  '这个灵感有什么独特的创新点？',
  '这个灵感可以延伸出什么故事线？'
];

export default function InspirationQuestioner({ 
  inspirationType, 
  inspirationTitle, 
  inspirationData, 
  worldContext,
  onClose 
}: InspirationQuestionerProps) {
  const [messages, setMessages] = useState<InspirationMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getTypeIcon = () => {
    switch (inspirationType) {
      case 'historicalEvent':
      default:
        return <History className="w-5 h-5 text-white" />;
      case 'fictionalWorld':
        return <BookOpen className="w-5 h-5 text-white" />;
      case 'plotFragment':
        return <SparklesIcon className="w-5 h-5 text-white" />;
    }
  };

  const formatInspirationData = () => {
    let content = `标题：${inspirationData.title}\n\n`;
    if (inspirationData.description) {
      content += `描述：${inspirationData.description}\n\n`;
    }
    if (inspirationData.similarity) {
      content += `相似点：${inspirationData.similarity}\n\n`;
    }
    if (inspirationData.worldConnection) {
      content += `世界观关联：${inspirationData.worldConnection}\n\n`;
    }
    if (inspirationData.application) {
      content += `如何应用：${inspirationData.application}`;
    }
    return content;
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: InspirationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/inspiration-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspirationType,
          inspirationTitle,
          inspirationData,
          userQuestion: inputText.trim(),
          previousMessages: messages,
          worldContext,
        }),
      });

      if (!response.ok) throw new Error('API请求失败');

      const data = await response.json();
      
      const assistantMessage: InspirationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || '抱歉，生成失败了，请重试。',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-forge-copper/20">
        <div className="flex items-center justify-between p-4 border-b border-forge-copper/20 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-forge-copper to-forge-gold rounded-lg flex items-center justify-center">
              {getTypeIcon()}
            </div>
            <div>
              <h2 className="text-forge-copper font-fantasy text-lg">「{inspirationTitle}」- 深入追问</h2>
              <p className="text-gray-500 text-xs">基于{INSPIRATION_TYPE_NAMES[inspirationType]}深度探索</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-red-500 text-gray-600 hover:text-white transition-all duration-300 transform hover:scale-110 shadow-lg flex items-center justify-center"
            title="关闭"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 bg-gray-50 border-b border-forge-copper/10">
          <div className="text-forge-copper text-sm font-semibold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-forge-copper rounded-full"></span>
            当前灵感信息
          </div>
          <div className="bg-white/80 rounded-lg p-3 text-gray-700 text-sm max-h-40 overflow-y-auto">
            <div className="space-y-2">
              <div><span className="font-semibold text-forge-copper">📌 标题：</span>{inspirationData.title}</div>
              {inspirationData.description && (
                <div><span className="font-semibold text-gray-600">📝 描述：</span>{inspirationData.description}</div>
              )}
              {inspirationData.worldConnection && (
                <div className="bg-green-50 p-2 rounded"><span className="font-semibold text-green-700">🌍 世界观关联：</span>{inspirationData.worldConnection}</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-forge-copper/20 to-forge-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-forge-copper" />
              </div>
              <p className="text-gray-500 mb-4">针对「{inspirationTitle}」这个灵感提问</p>
              <div className="flex flex-wrap justify-center gap-2">
                {INSPIRATION_QUICK_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    onClick={() => setInputText(question)}
                    className="px-3 py-1.5 bg-gray-100 border border-forge-copper/30 rounded-full text-gray-700 hover:border-forge-copper/50 text-xs transition-all"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-forge-copper/20 text-gray-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString('zh-CN')}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="mx-4 mb-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="p-4 border-t border-forge-copper/20 bg-gray-50">
          <div className="flex gap-3">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="输入你的追问..."
              className="flex-1 bg-white border border-forge-copper/30 rounded-lg px-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-forge-copper/50 resize-none"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '100px' }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !inputText.trim()}
              className="px-4 py-2 bg-gradient-to-r from-forge-copper to-forge-gold rounded-lg text-white hover:from-forge-gold hover:to-forge-copper transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
