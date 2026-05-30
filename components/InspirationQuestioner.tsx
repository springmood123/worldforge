'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Sparkles, BookOpen, History, Download, FileText, FileDown } from 'lucide-react';

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
  // 生成唯一的存储键
  const storageKey = `inspiration_conversation_${inspirationType}_${inspirationTitle}`;
  
  const [messages, setMessages] = useState<InspirationMessage[]>(() => {
    // 初始化时从 localStorage 加载历史记录
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // 转换时间戳回 Date 对象
          return parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        } catch {
          return [];
        }
      }
    }
    return [];
  });
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

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
        return <Sparkles className="w-5 h-5 text-white" />;
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

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
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

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
    } finally {
      setLoading(false);
    }
  };

  const formatConversationForExport = (): string => {
    let content = '';
    content += `═══════════════════════════════════════════════════════════════\n`;
    content += `                    WorldForge 会话记录\n`;
    content += `═══════════════════════════════════════════════════════════════\n\n`;
    content += `📌 灵感类型: ${INSPIRATION_TYPE_NAMES[inspirationType]}\n`;
    content += `📌 灵感标题: ${inspirationTitle}\n`;
    content += `📅 导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
    content += `───────────────────────────────────────────────────────────────\n`;
    content += `                       灵感详情\n`;
    content += `───────────────────────────────────────────────────────────────\n\n`;
    content += formatInspirationData() + '\n\n';
    content += `───────────────────────────────────────────────────────────────\n`;
    content += `                       世界观上下文\n`;
    content += `───────────────────────────────────────────────────────────────\n\n`;
    content += `${worldContext.substring(0, 500)}${worldContext.length > 500 ? '...' : ''}\n\n`;
    content += `═══════════════════════════════════════════════════════════════\n`;
    content += `                       对话记录\n`;
    content += `═══════════════════════════════════════════════════════════════\n\n`;
    
    messages.forEach((message, index) => {
      const roleLabel = message.role === 'user' ? '👤 用户' : '🤖 AI助手';
      const time = new Date(message.timestamp).toLocaleString('zh-CN');
      content += `[${index + 1}] ${roleLabel} (${time})\n`;
      content += `${'─'.repeat(60)}\n`;
      content += `${message.content}\n\n`;
    });

    content += `═══════════════════════════════════════════════════════════════\n`;
    content += `                    会话结束\n`;
    content += `═══════════════════════════════════════════════════════════════\n`;
    content += `共 ${messages.length} 条消息 | WorldForge 世界观构建工具\n`;
    
    return content;
  };

  const downloadAsTxt = () => {
    const content = formatConversationForExport();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WorldForge_${inspirationTitle}_灵感会话_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowDownloadOptions(false);
  };

  const downloadAsHtml = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WorldForge 灵感会话记录 - ${inspirationTitle}</title>
  <style>
    body { font-family: 'Microsoft YaHei', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .header { background: linear-gradient(135deg, #b87333, #d4af37); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px; }
    .meta { background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .meta-item { margin: 8px 0; }
    .meta-label { color: #b87333; font-weight: bold; }
    .inspiration-section { background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .section-title { color: #b87333; font-size: 18px; border-bottom: 2px solid #b87333; padding-bottom: 10px; margin-bottom: 15px; }
    .message { background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .message-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .role-user { color: #2d3748; font-weight: bold; }
    .role-assistant { color: #b87333; font-weight: bold; }
    .timestamp { color: #718096; font-size: 12px; }
    .message-content { white-space: pre-wrap; line-height: 1.6; }
    .user-message { border-left: 4px solid #2d3748; }
    .assistant-message { border-left: 4px solid #b87333; }
    .footer { text-align: center; color: #718096; padding: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>WorldForge 灵感会话记录</h1>
    <p>世界观构建工具</p>
  </div>
  
  <div class="meta">
    <div class="meta-item"><span class="meta-label">📌 灵感类型:</span> ${INSPIRATION_TYPE_NAMES[inspirationType]}</div>
    <div class="meta-item"><span class="meta-label">📌 灵感标题:</span> ${inspirationTitle}</div>
    <div class="meta-item"><span class="meta-label">📅 导出时间:</span> ${new Date().toLocaleString('zh-CN')}</div>
    <div class="meta-item"><span class="meta-label">📊 消息数量:</span> ${messages.length}</div>
  </div>
  
  <div class="inspiration-section">
    <div class="section-title">灵感详情</div>
    <div><strong>标题：</strong>${inspirationData.title}</div>
    ${inspirationData.description ? `<div><strong>描述：</strong>${inspirationData.description}</div>` : ''}
    ${inspirationData.similarity ? `<div><strong>相似点：</strong>${inspirationData.similarity}</div>` : ''}
    ${inspirationData.worldConnection ? `<div style="background: #e8f5e9; padding: 8px; border-radius: 4px;"><strong>🌍 世界观关联：</strong>${inspirationData.worldConnection}</div>` : ''}
    ${inspirationData.application ? `<div><strong>如何应用：</strong>${inspirationData.application}</div>` : ''}
  </div>
  
  <div class="inspiration-section">
    <div class="section-title">世界观上下文</div>
    <p>${worldContext.substring(0, 500)}${worldContext.length > 500 ? '...' : ''}</p>
  </div>
  
  <div class="section-title" style="margin-top: 20px;">对话记录</div>
  
  ${messages.map((message, index) => `
    <div class="message ${message.role === 'user' ? 'user-message' : 'assistant-message'}">
      <div class="message-header">
        <span class="${message.role === 'user' ? 'role-user' : 'role-assistant'}">
          ${message.role === 'user' ? '👤 用户' : '🤖 AI助手'}
        </span>
        <span class="timestamp">${new Date(message.timestamp).toLocaleString('zh-CN')}</span>
      </div>
      <div class="message-content">${message.content}</div>
    </div>
  `).join('')}
  
  <div class="footer">
    <p>WorldForge 世界观构建工具 | 共 ${messages.length} 条消息</p>
  </div>
</body>
</html>
    `.trim();

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WorldForge_${inspirationTitle}_灵感会话_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowDownloadOptions(false);
  };

  const downloadAsMarkdown = () => {
    let content = '';
    content += `# WorldForge 灵感会话记录\n\n`;
    content += `---\n\n`;
    content += `## 基本信息\n\n`;
    content += `- **灵感类型**: ${INSPIRATION_TYPE_NAMES[inspirationType]}\n`;
    content += `- **灵感标题**: ${inspirationTitle}\n`;
    content += `- **导出时间**: ${new Date().toLocaleString('zh-CN')}\n`;
    content += `- **消息数量**: ${messages.length}\n\n`;
    content += `---\n\n`;
    content += `## 灵感详情\n\n`;
    content += `### 标题\n${inspirationData.title}\n\n`;
    if (inspirationData.description) {
      content += `### 描述\n${inspirationData.description}\n\n`;
    }
    if (inspirationData.similarity) {
      content += `### 相似点\n${inspirationData.similarity}\n\n`;
    }
    if (inspirationData.worldConnection) {
      content += `### 🌍 世界观关联\n${inspirationData.worldConnection}\n\n`;
    }
    if (inspirationData.application) {
      content += `### 如何应用\n${inspirationData.application}\n\n`;
    }
    content += `---\n\n`;
    content += `## 世界观上下文\n\n`;
    content += `> ${worldContext.substring(0, 500)}${worldContext.length > 500 ? '...' : ''}\n\n`;
    content += `---\n\n`;
    content += `## 对话记录\n\n`;
    
    messages.forEach((message, index) => {
      const roleLabel = message.role === 'user' ? '👤 用户' : '🤖 AI助手';
      const time = new Date(message.timestamp).toLocaleString('zh-CN');
      content += `### ${index + 1}. ${roleLabel}\n`;
      content += `*${time}*\n\n`;
      content += `${message.content}\n\n`;
      content += `---\n\n`;
    });

    content += `## 会话结束\n\n`;
    content += `*WorldForge 世界观构建工具*\n`;
    
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WorldForge_${inspirationTitle}_灵感会话_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowDownloadOptions(false);
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
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                className="px-4 py-2 bg-gradient-to-r from-forge-copper to-forge-gold rounded-lg text-white hover:from-forge-gold hover:to-forge-copper transition-all flex items-center gap-2"
                title="下载会话记录"
              >
                <Download className="w-4 h-4" />
                导出记录
              </button>
            )}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-200 hover:bg-red-500 text-gray-600 hover:text-white transition-all duration-300 transform hover:scale-110 shadow-lg flex items-center justify-center"
              title="关闭"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {showDownloadOptions && (
          <div className="mx-4 mt-2 bg-white border border-forge-copper/30 rounded-lg p-4 shadow-lg">
            <div className="text-forge-copper font-semibold mb-3 flex items-center gap-2">
              <FileDown className="w-5 h-5" />
              选择导出格式
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={downloadAsTxt}
                className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-forge-copper/10 border border-gray-200 hover:border-forge-copper/50 rounded-lg transition-all"
              >
                <FileText className="w-6 h-6 text-forge-copper" />
                <span className="text-sm text-gray-700">TXT 文档</span>
                <span className="text-xs text-gray-500">纯文本格式</span>
              </button>
              <button
                onClick={downloadAsHtml}
                className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-forge-copper/10 border border-gray-200 hover:border-forge-copper/50 rounded-lg transition-all"
              >
                <FileText className="w-6 h-6 text-forge-copper" />
                <span className="text-sm text-gray-700">HTML 文档</span>
                <span className="text-xs text-gray-500">网页格式</span>
              </button>
              <button
                onClick={downloadAsMarkdown}
                className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-forge-copper/10 border border-gray-200 hover:border-forge-copper/50 rounded-lg transition-all"
              >
                <FileText className="w-6 h-6 text-forge-copper" />
                <span className="text-sm text-gray-700">Markdown</span>
                <span className="text-xs text-gray-500">通用格式</span>
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-500 text-center">
              文件将保存到您的下载文件夹
            </div>
          </div>
        )}

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