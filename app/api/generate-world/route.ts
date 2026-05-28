import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    // 调试：检查环境变量
    console.log('API Key configured:', process.env.ZHIPU_API_KEY ? 'Yes' : 'No');
    if (process.env.ZHIPU_API_KEY) {
      console.log('API Key length:', process.env.ZHIPU_API_KEY.length);
    }

    const systemPrompt = `
你是一位经验丰富的世界观构建大师和创意顾问，擅长为作家、游戏设计师和OC创作者构建丰富、详细且有画面感的架空世界。

你的任务是根据用户提供的主题、灵感和关键词，生成一个完整的世界观设定。

输出格式要求：
请以JSON格式输出，包含以下字段：
1. socialCulture: 社会文化与阶层描述（直接是字符串，不要嵌套对象）
2. customs: 独特习俗与节日描述（直接是字符串，不要嵌套对象）
3. geography: 地理环境与气候描述（直接是字符串，不要嵌套对象）
4. factions: 核心势力/种族描述（直接是字符串，不要嵌套对象，至少列出3个）
5. characters: 角色示例数组（至少3个，每个包含name、personality、quirk字段）
6. backstory: 核心背景故事/冲突钩子（直接是字符串，不要嵌套对象）

所有输出必须为中文，详细且富有画面感，让读者能够清晰地想象出这个世界的样子。

示例格式：
{
  "socialCulture": "这个世界的社会分为三个阶层...",
  "customs": "每年春天会举办盛大的祈雨仪式...",
  "geography": "这片大陆被无尽海洋环绕...",
  "factions": "1. 光明教会：信仰光明之神... 2. 暗影兄弟会：追求黑暗力量... 3. 商人联盟：控制着贸易航线...",
  "characters": [{"name": "艾瑞斯", "personality": "勇敢但冲动", "quirk": "总是戴着一顶旧帽子"}],
  "backstory": "三百年前，一场灾难毁灭了古老文明..."
}
`.trim();

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response Error:', response.status, errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message?.content) {
      throw new Error('Invalid response format from API');
    }

    const content = data.choices[0].message.content;
    console.log('Raw AI Response:', content);
    
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      console.warn('Response is not valid JSON');
      result = { 
        socialCulture: content,
        customs: '',
        geography: '',
        factions: '',
        characters: [],
        backstory: ''
      };
    }

    // 提取描述内容，如果是对象则尝试获取 description 字段
    const getTextContent = (value: any): string => {
      if (typeof value === 'string') return value;
      if (value && typeof value === 'object' && 'description' in value) {
        return typeof value.description === 'string' ? value.description : JSON.stringify(value.description);
      }
      if (value && typeof value === 'object') {
        return JSON.stringify(value, null, 2);
      }
      return '';
    };

    const formattedResult = {
      socialCulture: getTextContent(result.socialCulture),
      customs: getTextContent(result.customs),
      geography: getTextContent(result.geography),
      factions: getTextContent(result.factions),
      characters: Array.isArray(result.characters) ? result.characters.map((char: any) => ({
        name: char.name || '',
        personality: char.personality || '',
        quirk: char.quirk || ''
      })) : [],
      backstory: getTextContent(result.backstory),
    };
    
    return NextResponse.json(formattedResult);
  } catch (error) {
    console.error('Error generating world:', error);
    return NextResponse.json(
      { error: '生成世界观时发生错误，请稍后重试' },
      { status: 500 }
    );
  }
}
