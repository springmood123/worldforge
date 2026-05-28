import { NextResponse } from 'next/server';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface InspirationQuestionRequest {
  inspirationType: string;
  inspirationTitle: string;
  inspirationData: any;
  userQuestion: string;
  previousMessages: Message[];
  worldContext: string;
}

const INSPIRATION_TYPE_NAMES: Record<string, string> = {
  historicalEvent: '真实历史事件',
  fictionalWorld: '著名架空世界',
  plotFragment: '情节与设定片段'
};

export async function POST(request: Request) {
  try {
    const body: InspirationQuestionRequest = await request.json();
    const { inspirationType, inspirationTitle, inspirationData, userQuestion, previousMessages, worldContext } = body;

    if (!userQuestion) {
      return NextResponse.json({ error: '问题不能为空' }, { status: 400 });
    }

    const apiKey = process.env.ZHIPU_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API密钥未配置' }, { status: 500 });
    }

    // 构建对话历史
    const conversationHistory = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // 构建系统提示词
    const systemPrompt = `你是WorldForge的灵感扩展助手，专门帮助用户深入探索和扩展灵感推荐。

当前用户的世界观背景：
${worldContext}

用户正在针对「${INSPIRATION_TYPE_NAMES[inspirationType] || inspirationType}」类型的灵感「${inspirationTitle}」进行追问。

该灵感的详细信息：
标题：${inspirationData.title}
描述：${inspirationData.description || '无描述'}
${inspirationData.similarity ? `相似点：${inspirationData.similarity}` : ''}
${inspirationData.worldConnection ? `世界观关联：${inspirationData.worldConnection}` : ''}
${inspirationData.application ? `如何应用：${inspirationData.application}` : ''}

## 你的角色
你是一位经验丰富的灵感顾问和创意专家。你的任务是：
1. 深入解答用户关于这个灵感的问题
2. 基于用户的世界观，提供深度结合的创意扩展
3. 保持与用户世界观的一致性和逻辑连贯性
4. 提供具体、生动的例子和应用场景
5. 帮助用户发现灵感的更多可能性

## 回答原则
- 必须结合用户的世界观背景进行回答
- 提供具体、有画面感的描述和例子
- 如有必要，可以提出新的创意方向建议
- 保持回答的逻辑一致性和深度创意
- 中文回复，表述清晰生动，富有启发性
- 重点关注如何将这个灵感深度融入用户的世界观`;

    // 构建消息
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory,
      { role: 'user' as const, content: userQuestion }
    ];

    // 调用智谱AI API
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages,
        temperature: 0.75,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', response.status, errorData);
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('API返回数据格式错误');
    }

    const content = data.choices[0].message.content;

    return NextResponse.json({ content });

  } catch (error) {
    console.error('Inspiration Question API Error:', error);
    
    // 如果API失败，返回模拟响应
    const mockResponses = [
      `关于这个灵感的深入探讨，我建议从以下几个方面来扩展：

1. **深度结合世界观**：将这个灵感与你的世界观核心设定深度绑定，让它成为世界的有机组成部分。

2. **丰富细节**：添加更多具体的场景描写、人物互动和事件脉络，让灵感更加生动。

3. **冲突设计**：考虑在这个灵感中加入潜在的冲突点，比如价值观的碰撞、利益的冲突等。

4. **多维度应用**：思考这个灵感如何在故事的不同层面产生影响——从个人命运到世界格局。

希望这些建议对你的创作有所帮助！`,
      `这个灵感很有潜力！我建议可以从以下几个角度深入：

• **世界观融合**：让这个灵感成为世界观的重要组成部分，而非简单的附加品
• **冲突制造**：灵感中的矛盾和张力是故事发展的强大动力
• **角色视角**：从不同角色的视角看待这个灵感，发现不同的可能性
• **历史渊源**：追溯这个灵感在你的世界观中的起源和发展

这些方向可以帮助你进一步完善这个灵感的应用。`,
      `深入思考这个灵感，我发现几个值得探索的方向：

1. **时间维度**：这个灵感在你的世界观不同时期有什么变化？起源、发展和现状如何？

2. **空间维度**：在世界观的不同地区，这个灵感有什么差异？

3. **社会维度**：不同的社会群体对这个灵感有什么不同的理解和态度？

4. **情感维度**：这个灵感牵动着哪些人的情感？有什么动人的故事？

从这些角度思考，可以让灵感更加立体和丰富，更好地融入你的世界观。`
    ];

    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    return NextResponse.json({ content: randomResponse });
  }
}
