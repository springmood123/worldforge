import { NextResponse } from 'next/server';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface QuestionRequest {
  sectionType: string;
  sectionTitle: string;
  sectionContent: string;
  userQuestion: string;
  previousMessages: Message[];
  worldContext: string;
}

const SECTION_NAMES: Record<string, string> = {
  socialCulture: '社会文化与阶层',
  customs: '独特习俗与节日',
  geography: '地理环境与气候',
  factions: '核心势力/种族',
  characters: '角色示例',
  backstory: '核心背景故事'
};

export async function POST(request: Request) {
  try {
    const body: QuestionRequest = await request.json();
    const { sectionType, sectionTitle, sectionContent, userQuestion, previousMessages, worldContext } = body;

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
    const systemPrompt = `你是WorldForge世界构建助手，专门帮助用户深入探索和扩展架空世界观设定。

当前用户正在探索的世界观背景：
${worldContext}

用户正在针对「${sectionTitle}」这个板块进行追问。
该板块的当前内容：
${sectionContent}

## 你的角色
你是一位经验丰富的世界观构建大师和创意顾问。你的任务是：
1. 深入解答用户关于这个板块的问题
2. 基于已有的世界观内容，提供合理且富有创意的扩展
3. 保持世界观的一致性和逻辑连贯性
4. 用生动、具体的描述帮助用户构建更丰富的世界

## 回答原则
- 结合当前板块内容和整体世界观背景进行回答
- 提供具体、有画面感的描述和例子
- 如有必要，可以提出新的设定建议
- 保持回答的逻辑一致性和创意性
- 中文回复，表述清晰生动`;

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
        temperature: 0.7,
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
    console.error('Section Question API Error:', error);
    
    // 如果API失败，返回模拟响应
    const mockResponses = [
      `关于这个板块的深入探讨，我建议从以下几个方面来扩展：

1. **细节丰富化**：可以添加更多具体的场景描写和人物互动，让设定更加生动。

2. **冲突设计**：考虑在这个板块中加入潜在的冲突点，比如不同势力之间的矛盾、价值观的碰撞等。

3. **历史渊源**：追溯这个设定的起源和发展历程，增加世界观的深度。

4. **与其他板块的联动**：思考这个板块如何与其他设定相互影响，共同构成完整的世界。

希望这些建议对你的创作有所帮助！`,
      `这个板块的设定很有潜力！我建议可以从以下几个角度深入：

• **细节描写**：加入具体的物品、语言、仪式等元素，让设定更具象
• **冲突制造**：设定中的矛盾和张力是故事发展的动力
• **文化背景**：构建这个设定形成的历史和社会条件
• **角色视角**：从不同角色的视角看待这个设定，发现不同的可能性

这些方向可以帮助你进一步完善这个世界观设定。`,
      `深入思考这个板块，我发现几个值得探索的方向：

1. **时间维度**：这个设定在不同时期有什么变化？起源、发展和现状如何？

2. **空间维度**：在世界的不同地区，这个设定有什么差异？

3. **社会维度**：不同的社会群体对这个设定有什么不同的理解和态度？

4. **情感维度**：这个设定牵动着哪些人的情感？有什么动人的故事？

从这些角度思考，可以让世界观更加立体和丰富。`
    ];

    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    return NextResponse.json({ content: randomResponse });
  }
}
