import { NextResponse } from 'next/server';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: Request) {
  try {
    const { term, messages, worldContext, provider } = await request.json();

    // 构建提示词
    const systemPrompt = `你是一位经验丰富的世界观构建顾问，精通架空世界设计。你的任务是帮助用户深入探索和扩展世界观中的概念和词汇。

当前世界观背景：
${worldContext}

用户正在探索的词汇/概念：${term}

请用中文详细回答用户的问题，确保回答：
1. 基于上述世界观背景
2. 内容丰富且有深度
3. 提供具体的示例和细节
4. 保持与世界观设定一致
5. 语言生动，具有画面感`;

    // 准备消息数组
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: Message) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    let response;

    // 根据选择的提供商调用相应的API
    if (provider === 'zhipu') {
      response = await callZhipuAI(fullMessages);
    } else if (provider === 'moonshot') {
      response = await callMoonshot(fullMessages);
    } else if (provider === 'deepseek') {
      response = await callDeepSeek(fullMessages);
    } else {
      // 默认使用智谱AI
      response = await callZhipuAI(fullMessages);
    }

    return NextResponse.json({ content: response });
  } catch (error) {
    console.error('词汇探索API错误:', error);
    return NextResponse.json(
      { content: '抱歉，探索过程中出现了问题，请稍后重试。' },
      { status: 500 }
    );
  }
}

// 智谱AI API
async function callZhipuAI(messages: any[]): Promise<string> {
  const apiKey = process.env.ZHIPU_API_KEY;
  
  if (!apiKey) {
    // 如果没有API密钥，返回模拟响应
    return getMockResponse(messages[messages.length - 1].content);
  }

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`智谱AI请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '生成失败';
  } catch (error) {
    console.error('智谱AI调用失败:', error);
    return getMockResponse(messages[messages.length - 1].content);
  }
}

// 月之暗面API (备用)
async function callMoonshot(messages: any[]): Promise<string> {
  // 这里可以集成月之暗面的API
  return getMockResponse(messages[messages.length - 1].content);
}

// DeepSeek API (备用)
async function callDeepSeek(messages: any[]): Promise<string> {
  // 这里可以集成DeepSeek的API
  return getMockResponse(messages[messages.length - 1].content);
}

// 模拟响应（当API不可用时）
function getMockResponse(userQuestion: string): string {
  const responses = [
    `关于"${userQuestion}"，这是一个非常有趣的话题！在这个世界观中，这个概念具有深厚的历史背景和文化意义。它起源于古代的某个重要事件，经过长时间的演变，现在已经成为世界观中不可或缺的一部分。

这个概念涉及多个方面：
1. **社会影响**：它塑造了人们的价值观和行为准则
2. **文化表现**：在艺术、文学和日常生活中都有体现
3. **实际应用**：在政治、经济和军事领域都有重要作用

如果想深入了解某个特定方面，请继续提问！`,
    
    `针对"${userQuestion}"，让我来详细解释一下：

这个概念在世界观中扮演着关键角色，具有多层含义：

**历史演变**：从最初的简单形式发展到现在的复杂体系，经历了多个重要阶段。

**核心特征**：
- 独特的运作机制
- 与其他概念的相互关系
- 在不同情境下的表现形式

**现实意义**：它不仅是理论概念，还深刻影响着世界观中每一个角色的生活。

你还想了解哪些具体细节？`,

    `很好的问题！"${userQuestion}"确实值得深入探讨。

在这个世界观的框架下，我们可以从多个角度来分析：

**哲学层面**：这个概念反映了世界观的核心价值观
**实践层面**：在具体场景中如何体现和应用
**未来发展**：可能的演变方向和潜在影响

每一个角度都能展开丰富的内容。你对哪个方面最感兴趣？`
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}
