import { NextResponse } from 'next/server';

// 当JSON解析失败时，从文本中提取世界观内容
function parseWorldFromText(text: string) {
  const result: any = {
    socialCulture: '',
    customs: '',
    geography: '',
    factions: '',
    characters: [],
    backstory: ''
  };

  // 尝试按常见模式匹配
  const patterns = {
    socialCulture: [
      /社会文化.*?[：:]\s*([\s\S]*?)(?=\n\s*[独特习俗|地理环境|核心势力|角色示例|背景故事]|$)/i,
      /socialCulture.*?[：:]\s*([\s\S]*?)(?=\n\s*[customs|geography|factions|characters|backstory]|$)/i,
      /社会文化与阶层[：:]\s*([\s\S]*?)(?=\n\s*\d\.\s|$)/
    ],
    customs: [
      /独特习俗.*?[：:]\s*([\s\S]*?)(?=\n\s*[社会文化|地理环境|核心势力|角色示例|背景故事]|$)/i,
      /customs.*?[：:]\s*([\s\S]*?)(?=\n\s*[socialCulture|geography|factions|characters|backstory]|$)/i,
      /独特习俗与节日[：:]\s*([\s\S]*?)(?=\n\s*\d\.\s|$)/
    ],
    geography: [
      /地理环境.*?[：:]\s*([\s\S]*?)(?=\n\s*[社会文化|独特习俗|核心势力|角色示例|背景故事]|$)/i,
      /geography.*?[：:]\s*([\s\S]*?)(?=\n\s*[socialCulture|customs|factions|characters|backstory]|$)/i,
      /地理环境与气候[：:]\s*([\s\S]*?)(?=\n\s*\d\.\s|$)/
    ],
    factions: [
      /核心势力.*?[：:]\s*([\s\S]*?)(?=\n\s*[社会文化|独特习俗|地理环境|角色示例|背景故事]|$)/i,
      /factions.*?[：:]\s*([\s\S]*?)(?=\n\s*[socialCulture|customs|geography|characters|backstory]|$)/i,
      /核心势力\/种族[：:]\s*([\s\S]*?)(?=\n\s*\d\.\s|$)/
    ],
    backstory: [
      /背景故事.*?[：:]\s*([\s\S]*?)(?=\n\s*[社会文化|独特习俗|地理环境|核心势力|角色示例]|$)/i,
      /backstory.*?[：:]\s*([\s\S]*?)(?=\n\s*[socialCulture|customs|geography|factions|characters]|$)/i
    ]
  };

  // 尝试匹配每个字段
  for (const [field, regexList] of Object.entries(patterns)) {
    for (const regex of regexList) {
      const match = text.match(regex);
      if (match && match[1]) {
        result[field] = match[1].trim();
        break;
      }
    }
  }

  // 如果没有匹配到任何内容，把整个文本放到 socialCulture，其余为空
  if (!result.socialCulture && !result.customs && !result.geography && !result.factions && !result.backstory) {
    // 尝试按段落分割
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length >= 6) {
      result.socialCulture = lines[0]?.trim() || '';
      result.customs = lines[1]?.trim() || '';
      result.geography = lines[2]?.trim() || '';
      result.factions = lines[3]?.trim() || '';
      result.backstory = lines[5]?.trim() || '';
    } else {
      result.socialCulture = text;
    }
  }

  // 尝试提取角色
  const charPatterns = [
    /角色示例[：:]\s*([\s\S]*?)(?=\n\s*[社会文化|独特习俗|地理环境|核心势力|背景故事]|$)/i,
    /characters[：:]\s*([\s\S]*?)(?=\n\s*[socialCulture|customs|geography|factions|backstory]|$)/i
  ];

  for (const regex of charPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      result.characters = extractCharacters(match[1]);
      break;
    }
  }

  return result;
}

// 从文本中提取角色
function extractCharacters(text: string) {
  const characters: any[] = [];
  
  // 尝试匹配角色模式
  const patterns = [
    /(\d+[、\.\s]*([^：:\n]+)[：:]([^\n]*))/g,
    /[“"]([^"”]+)[”"]/g
  ];

  // 简单生成默认角色
  const defaultNames = ['旅行者', '守护者', '智者'];
  const defaultPersonalities = ['好奇勇敢', '忠诚沉稳', '睿智深沉'];
  const defaultQuirks = ['总是带着地图', '随身带护身符', '喜欢讲故事'];

  for (let i = 0; i < 3; i++) {
    characters.push({
      name: defaultNames[i],
      personality: defaultPersonalities[i],
      quirk: defaultQuirks[i]
    });
  }

  return characters;
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    // 调试：检查环境变量
    console.log('API Key configured:', process.env.ZHIPU_API_KEY ? 'Yes' : 'No');
    if (process.env.ZHIPU_API_KEY) {
      console.log('API Key length:', process.env.ZHIPU_API_KEY.length);
    }

    const systemPrompt = `
你是一位经验丰富的世界观构建大师。

输出要求：
1. 只输出JSON，不要任何其他文字
2. 不要添加说明、不要加格式标记
3. 直接输出：{"socialCulture":"...","customs":"...","geography":"...","factions":"...","characters":[...],"backstory":"..."}

字段说明：
- socialCulture: 社会文化与阶层（200字）
- customs: 习俗与节日（150字）
- geography: 地理环境（150字）
- factions: 核心势力（200字，至少3个）
- characters: 角色数组（3个，每个有name、personality、quirk）
- backstory: 背景故事（200字）

全部使用中文，内容要清晰、有画面感！
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

    let content = data.choices[0].message.content;
    console.log('Raw AI Response:', content);
    
    // 清理内容，只保留JSON部分
    content = content.trim();
    
    // 尝试提取JSON部分
    let jsonStr = content;
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = content.substring(firstBrace, lastBrace + 1);
    }
    
    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.warn('JSON parsing failed, trying alternative parsing');
      
      // 如果JSON解析失败，尝试从文本中提取各个部分
      result = parseWorldFromText(content);
    }

    // 提取描述内容
    const getTextContent = (value: any): string => {
      if (typeof value === 'string') return value.trim();
      if (value && typeof value === 'object' && 'description' in value) {
        return typeof value.description === 'string' ? value.description.trim() : JSON.stringify(value.description);
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
