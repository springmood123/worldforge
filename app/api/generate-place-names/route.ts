import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { theme } = await request.json();

    const systemPrompt = `
你是一位精通命名艺术的幻想世界语言学家。根据用户提供的世界观主题，生成一组符合该世界风格的地名。

输出格式要求：
请以JSON格式输出，包含一个名为placeNames的数组，包含8个地名。
地名称呼要独特且符合主题风格，不要使用现代常见地名。

示例：
{"placeNames": ["艾瑞斯港", "月影森林", "钢脊山脉", "琉璃湖", "灰烬平原", "星穹学院", "迷雾沼泽", "雷霆要塞"]}
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
          { role: 'user', content: theme },
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response Error:', response.status, errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Place Names API Response:', JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0] || !data.choices[0].message?.content) {
      throw new Error('Invalid response format from API');
    }

    const content = data.choices[0].message.content;
    console.log('Place Names Raw Content:', content);
    
    let result;
    try {
      result = JSON.parse(content);
      // 确保返回正确的格式
      if (!result.placeNames || !Array.isArray(result.placeNames)) {
        console.warn('Response does not contain placeNames array, generating defaults');
        result = { placeNames: generateDefaultNames() };
      }
    } catch {
      console.warn('Response is not valid JSON, generating default names');
      result = { placeNames: generateDefaultNames() };
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating place names:', error);
    return NextResponse.json(
      { placeNames: generateDefaultNames() },
      { status: 500 }
    );
  }
}

// 生成默认地名
function generateDefaultNames(): string[] {
  const defaultNames = [
    '晨曦港', '月影森林', '青石山脉', '翡翠湖', 
    '烈焰平原', '星尘塔', '迷雾沼泽', '钢铁要塞',
    '水晶谷', '风暴之海', '黄金城', '暗夜神殿'
  ];
  // 随机选择8个
  const shuffled = [...defaultNames].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 8);
}
