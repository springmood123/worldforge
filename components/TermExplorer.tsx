'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, History, Loader2 } from 'lucide-react';

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

interface TermExplorerProps {
  worldContext: string;
  onClose: () => void;
  initialTerm?: string;
  initialConversations?: TermConversation[];
  onConversationsChange?: (conversations: TermConversation[]) => void;
}

const FREE_LLM_PROVIDERS = [
  { id: 'zhipu', name: '智谱AI', icon: 'GLM-4-Flash' },
  { id: 'moonshot', name: '月之暗面', icon: 'Kimi' },
  { id: 'deepseek', name: 'DeepSeek', icon: 'DeepSeek-V2' },
];

export default function TermExplorer({ 
  worldContext, 
  onClose, 
  initialTerm,
  initialConversations = [],
  onConversationsChange 
}: TermExplorerProps) {
  const [selectedProvider, setSelectedProvider] = useState('zhipu');
  const [conversations, setConversations] = useState<TermConversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialConversations.length > 0) {
      setConversations(initialConversations);
    }
  }, [initialConversations]);

  const updateParentConversations = (newConversations: TermConversation[]) => {
    if (onConversationsChange) {
      onConversationsChange(newConversations);
    }
  };

  useEffect(() => {
    if (initialTerm && !activeConversationId && conversations.length === 0) {
      const newConversation: TermConversation = {
        id: Date.now().toString(),
        term: initialTerm,
        messages: [],
        timestamp: new Date(),
      };
      setConversations([newConversation]);
      updateParentConversations([newConversation]);
      setActiveConversationId(newConversation.id);
      setTimeout(() => {
        setInputText(`请详细介绍一下「${initialTerm}」这个概念，包括它的历史、特点和在这个世界观中的重要性。`);
      }, 100);
    }
  }, [initialTerm]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversationId, conversations]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const startNewConversation = (term: string) => {
    const newConversation: TermConversation = {
      id: Date.now().toString(),
      term,
      messages: [],
      timestamp: new Date(),
    };
    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    updateParentConversations(updatedConversations);
    setActiveConversationId(newConversation.id);
    setError('');
  };

  const switchConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setShowHistory(false);
    setError('');
  };

  const deleteConversation = (conversationId: string) => {
    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    setConversations(updatedConversations);
    updateParentConversations(updatedConversations);
    if (activeConversationId === conversationId) {
      setActiveConversationId(updatedConversations.length > 0 ? updatedConversations[0].id : null);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !activeConversation) return;

    const userMessage: TermMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    const updatedConversations = conversations.map(c => 
      c.id === activeConversationId 
        ? { ...c, messages: [...c.messages, userMessage] }
        : c
    );
    setConversations(updatedConversations);
    updateParentConversations(updatedConversations);

    setInputText('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/explore-term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: activeConversation.term,
          messages: [...activeConversation.messages, userMessage],
          worldContext,
          provider: selectedProvider,
        }),
      });

      if (!response.ok) throw new Error('API请求失败');

      const data = await response.json();
      
      const assistantMessage: TermMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || '抱歉，生成失败了，请重试。',
        timestamp: new Date(),
      };

      const finalUpdatedConversations = updatedConversations.map(c => 
        c.id === activeConversationId 
          ? { ...c, messages: [...c.messages, userMessage, assistantMessage] }
          : c
      );
      setConversations(finalUpdatedConversations);
      updateParentConversations(finalUpdatedConversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-forge-copper/20">
        <div className="flex items-center justify-between p-4 border-b border-forge-copper/20 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-forge-copper to-forge-gold rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-forge-copper font-fantasy text-lg">词汇探索</h2>
              <p className="text-gray-500 text-xs">深入探索世界观中的概念</p>
              <p className="text-gray-500 text-xs mt-1">每个词条点击都可以追问，每次追问后的记录都可以保留</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-lg hover:bg-forge-copper/10 text-gray-600 hover:text-forge-copper transition-colors"
            >
              <History className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-200 hover:bg-red-500 text-gray-600 hover:text-white transition-all duration-300 transform hover:scale-110 shadow-lg flex items-center justify-center"
              title="关闭"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {showHistory && (
            <div className="w-64 border-r border-forge-copper/20 bg-gray-50 flex flex-col">
              <div className="p-4 border-b border-forge-copper/20">
                <h3 className="text-forge-copper font-semibold text-sm">对话历史</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {conversations.length === 0 ? (
                  <div className="text-gray-500 text-xs text-center py-8">暂无历史记录</div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-200 hover:border-forge-copper/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0" onClick={() => switchConversation(conv.id)}>
                          <div className={`text-sm font-semibold truncate ${
                            activeConversationId === conv.id ? 'text-forge-copper' : 'text-gray-700'
                          }`}>
                            {conv.term}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {new Date(conv.timestamp).toLocaleString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="p-1 text-red-500 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-w-0">
            {!activeConversation ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-forge-copper/20 to-forge-gold/20 rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="w-10 h-10 text-forge-copper" />
                </div>
                <h3 className="text-forge-copper text-xl font-fantasy mb-2">开始探索</h3>
                <p className="text-gray-500 mb-2 max-w-md">
                  在世界观内容中选择任意词汇或概念，点击即可开始探索
                </p>
                <p className="text-gray-500 mb-4 max-w-md text-sm">
                  每个词条点击都可以追问，每次追问后的记录都可以保留
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <p className="text-gray-600">💡 提示：点击内容中高亮显示的词汇可以直接选择</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-forge-copper/20 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-[#b19716] font-semibold text-sm">正在探索：{activeConversation.term}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">选择LLM：</span>
                      <select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="bg-white border border-forge-copper/30 rounded-lg px-3 py-1 text-gray-700 text-sm focus:outline-none focus:border-forge-copper/50"
                      >
                        {FREE_LLM_PROVIDERS.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name} - {provider.icon}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {activeConversation.messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm mb-4">开始探索「{activeConversation.term}」</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {[
                          '详细介绍这个概念',
                          '在世界观中的作用',
                          '相关的历史事件',
                          '可能的发展方向'
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => setInputText(suggestion)}
                            className="px-3 py-1.5 bg-gray-100 border border-forge-copper/30 rounded-full text-gray-700 hover:border-forge-copper/50 text-xs transition-all"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    activeConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
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

                {conversations.length > 1 && (
                  <div className="border-t border-forge-copper/20 bg-gray-50">
                    <div className="p-3 bg-gray-100/50 border-b border-forge-copper/10">
                      <h4 className="text-forge-copper text-sm font-semibold flex items-center gap-2">
                        <History className="w-4 h-4" />
                        其他词条追问历史 ({conversations.length - 1})
                      </h4>
                    </div>
                    <div className="p-3 max-h-40 overflow-y-auto space-y-2">
                      {conversations
                        .filter(c => c.id !== activeConversationId)
                        .reverse()
                        .map((conv) => (
                          <div
                            key={conv.id}
                            onClick={() => switchConversation(conv.id)}
                            className="p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors border border-transparent hover:border-forge-copper/30"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-forge-copper font-semibold text-sm">{conv.term}</div>
                                <div className="text-gray-500 text-xs">
                                  {conv.messages.length} 条对话 · {new Date(conv.timestamp).toLocaleString('zh-CN', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              {conv.messages.length > 0 && (
                                <div className="text-gray-500 text-xs max-w-[150px] truncate">
                                  最新：{conv.messages[conv.messages.length - 1].content.substring(0, 20)}...
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mx-4 mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="p-4 border-t border-forge-copper/20 bg-gray-50">
                  <div className="flex gap-3">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                      placeholder="输入你的问题..."
                      className="flex-1 bg-white border border-forge-copper/30 rounded-lg px-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-forge-copper/50 resize-none"
                      rows={1}
                      style={{ minHeight: '40px', maxHeight: '120px' }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={loading || !inputText.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-forge-copper to-forge-gold rounded-lg text-white hover:from-forge-gold hover:to-forge-copper transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
