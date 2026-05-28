import { NextResponse } from 'next/server';

// 记录历史生成的内容，用于去重
let generationHistory: string[] = [];
const MAX_HISTORY = 20;

export async function POST(request: Request) {
  try {
    const { worldDescription, diversityLevel = 'medium', avoidContent = [] } = await request.json();

    const systemPrompt = `
你是一位博学的历史学者和幻想文学专家，擅长为世界观构建提供多样化、具有深刻创意的灵感来源分析。

## 核心任务
根据用户提供的世界观描述，生成高度一致且富有创意的灵感推荐。

## 关键要求
1. **世界观一致性**：所有推荐的灵感必须与用户的世界观核心设定保持深度契合，每个灵感都要明确体现与世界观元素的关联
2. **内容多样性**：绝对避免重复或相似的表述，每次生成都要探索不同的创意方向
3. **创新深度**：提供具有启发性的分析，而非表面化的描述
4. **避免重复**：参考避免内容列表，不要生成与以下内容重复或相似的灵感：${avoidContent.length > 0 ? avoidContent.join('、') : '无'}

## 推荐结构（每个部分3个）

### 第一部分：真实历史事件
选择与用户世界观有深度相似性的真实历史事件，每个事件都要：
- 从政治、军事、文化、科技、社会变革等不同维度选择
- 分析与用户世界观的具体相似点（不要泛泛而谈）
- 提供具体的应用建议，而非空泛的想法

### 第二部分：著名架空世界
从奇幻、科幻、历史架空等不同类型中选择，每个世界都要：
- 分析其独特的世界构建手法
- 结合用户世界观说明可借鉴的具体元素
- 提供创新的融合方式，而非简单模仿

### 第三部分：情节与设定片段
从多个创意方向生成：
- 政治阴谋与权力斗争
- 神秘事件与超自然现象
- 社会变革与文化冲突
- 个人成长与命运抉择
- 探索发现与未知冒险

## 创意方向多样性
每次生成要从以下方向中选择不同的组合：
1. 时间维度：古代、中世纪、近代、现代、未来
2. 空间维度：陆地、海洋、天空、地下、太空
3. 主题维度：战争、和平、探索、发现、阴谋、爱情、信仰、背叛
4. 规模维度：个人、家庭、城市、国家、世界、宇宙

## 输出格式
严格JSON格式，包含以下字段：
- historicalEvents: [{title, description, similarity, application, worldConnection}]
- fictionalWorlds: [{title, description, similarity, application, worldConnection}]
- plotFragments: [{title, description, application, worldConnection}]

新增字段 worldConnection：明确说明该灵感与用户世界观的具体关联点。

## 多样性控制
多样性等级：${diversityLevel}
- low：保守，确保高质量但创意方向相似
- medium：平衡，在保持质量的同时探索不同方向
- high：激进，探索边缘和创新的可能性

## 示例（仅参考格式，不要重复内容！）
{
  "historicalEvents": [
    {
      "title": "文艺复兴",
      "description": "14至17世纪欧洲的思想文化运动...",
      "similarity": "与用户世界观中的知识复兴和思想解放高度相似...",
      "application": "可以构建一个知识重新发现的时代，引入古老智慧与新思想的冲突...",
      "worldConnection": "直接关联世界观中的知识阶层设定和魔法/科技复兴主题"
    }
  ],
  "fictionalWorlds": [
    {
      "title": "沙丘-厄拉科斯星",
      "description": "以香料贸易为核心的沙漠星球...",
      "similarity": "与用户世界观中的资源争夺和极端环境主题一致...",
      "application": "可以借鉴其围绕核心资源构建的权力结构...",
      "worldConnection": "完美契合世界观中的沙漠环境设定和资源政治"
    }
  ],
  "plotFragments": [
    {
      "title": "被遗忘的契约",
      "description": "一个古老的契约在特定条件下重新激活...",
      "application": "可以作为故事的核心驱动力，引出历史与现实的冲突...",
      "worldConnection": "与世界观中的古代魔法/契约设定直接关联"
    }
  ]
}

## 重要提醒
⚠️ 绝对不要重复使用常见的例子（如每次都推荐魔戒、十字军东征等）
⚠️ 每次生成都要探索新的创意方向
⚠️ 确保所有灵感都与用户世界观有明确的逻辑关联
⚠️ 每个灵感都要能清晰体现世界观的核心特征
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
          { role: 'user', content: worldDescription },
        ],
        temperature: diversityLevel === 'high' ? 0.9 : diversityLevel === 'medium' ? 0.7 : 0.5,
        max_tokens: 4000,
        presence_penalty: 0.3,  // 减少重复
        frequency_penalty: 0.3, // 减少重复
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response Error:', response.status, errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Inspiration API Response:', JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0] || !data.choices[0].message?.content) {
      throw new Error('Invalid response format from API');
    }

    const content = data.choices[0].message.content;
    console.log('Inspiration Raw Content:', content);
    
    let result;
    try {
      result = JSON.parse(content);
      // 验证数据结构
      if (!result.historicalEvents || !Array.isArray(result.historicalEvents)) {
        console.warn('Response missing historicalEvents, using defaults');
        result.historicalEvents = getRandomHistoricalEvents(3, avoidContent);
      }
      if (!result.fictionalWorlds || !Array.isArray(result.fictionalWorlds)) {
        console.warn('Response missing fictionalWorlds, using defaults');
        result.fictionalWorlds = getRandomFictionalWorlds(3, avoidContent);
      }
      if (!result.plotFragments || !Array.isArray(result.plotFragments)) {
        console.warn('Response missing plotFragments, using defaults');
        result.plotFragments = getRandomPlotFragments(3, avoidContent);
      }

      // 将新内容加入历史
      addToHistory(result);

    } catch {
      console.warn('Response is not valid JSON, using defaults');
      result = {
        historicalEvents: getRandomHistoricalEvents(3, avoidContent),
        fictionalWorlds: getRandomFictionalWorlds(3, avoidContent),
        plotFragments: getRandomPlotFragments(3, avoidContent),
      };
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error recommending inspiration:', error);
    // 返回默认数据
    const { worldDescription, avoidContent = [] } = await request.json();
    return NextResponse.json({
      historicalEvents: getRandomHistoricalEvents(3, avoidContent),
      fictionalWorlds: getRandomFictionalWorlds(3, avoidContent),
      plotFragments: getRandomPlotFragments(3, avoidContent),
    });
  }
}

// 添加到历史记录
function addToHistory(result: any) {
  const titles = [
    ...result.historicalEvents.map((e: any) => e.title),
    ...result.fictionalWorlds.map((w: any) => w.title),
    ...result.plotFragments.map((f: any) => f.title)
  ];
  
  generationHistory = [...generationHistory, ...titles].slice(-MAX_HISTORY);
}

// 获取随机历史事件（避免重复）
function getRandomHistoricalEvents(count: number, avoid: string[] = []) {
  const allEvents = [
    {
      title: "十字军东征",
      description: "中世纪欧洲基督教国家对中东地区发动的一系列宗教战争，持续近200年，对东西方文明交流产生深远影响。",
      similarity: "涉及宗教冲突、文化碰撞和领土争夺等主题",
      application: "可以借鉴宗教狂热与圣战的动机，以及不同文明碰撞产生的戏剧冲突",
      worldConnection: "与世界观中的宗教信仰设定和文明冲突主题高度契合"
    },
    {
      title: "丝绸之路",
      description: "连接东西方的古老贸易通道，促进了商品、文化和思想的交流，形成了多元文化交融的独特景观。",
      similarity: "涉及贸易网络、文化交流和跨区域互动",
      application: "可以构建世界中的贸易路线和文化传播路径，增加世界的真实感",
      worldConnection: "直接关联世界观中的商业和文化交流元素"
    },
    {
      title: "文艺复兴",
      description: "14至17世纪欧洲的思想文化运动，强调人文主义和科学探索，推动了艺术、科学和哲学的巨大进步。",
      similarity: "涉及思想解放、知识探索和文化繁荣",
      application: "可以设定一个知识复兴的时代背景，创造充满创新和变革的世界观",
      worldConnection: "与世界观中的知识阶层和文化复兴设定完美契合"
    },
    {
      title: "大航海时代",
      description: "15至17世纪欧洲探险家开辟新航路，发现新大陆，开启了全球化的序幕。",
      similarity: "涉及探索发现、未知领域和地理大发现",
      application: "可以作为世界构建的背景，引入新发现的土地和文化",
      worldConnection: "与世界观中的探索和未知领域设定直接相关"
    },
    {
      title: "工业革命",
      description: "18至19世纪的技术和社会变革，从手工业转向机器生产，彻底改变了人类社会。",
      similarity: "涉及技术进步、社会变革和新旧冲突",
      application: "可以构建从传统到现代的转变时期，创造技术与传统的冲突",
      worldConnection: "与世界观中的科技或魔法进步设定高度关联"
    },
    {
      title: "法国大革命",
      description: "18世纪末的政治社会革命，推翻了君主制，传播了自由平等博爱的理念。",
      similarity: "涉及革命、社会变革和权力更迭",
      application: "可以作为故事的历史背景，塑造革命与保守的冲突",
      worldConnection: "与世界观中的政治体制和社会变革设定紧密相关"
    },
    {
      title: "蒙古帝国扩张",
      description: "13世纪蒙古人建立的横跨欧亚的庞大帝国，促进了东西方的交流与融合。",
      similarity: "涉及帝国建设、征服与统治、文化融合",
      application: "可以借鉴多民族帝国的治理方式和文化融合的表现",
      worldConnection: "与世界观中的多民族或多文化设定深度契合"
    },
    {
      title: "黑死病大流行",
      description: "14世纪欧洲的毁灭性瘟疫，导致大量人口死亡，深刻改变了社会结构和人们的思想。",
      similarity: "涉及灾难、生存挑战和社会剧变",
      application: "可以构建灾后世界的恢复与重建，创造独特的社会氛围",
      worldConnection: "与世界观中的灾难或瘟疫设定直接相关"
    },
    {
      title: "明治维新",
      description: "19世纪日本的现代化改革，从封闭的封建社会迅速转变为现代国家。",
      similarity: "涉及快速现代化、传统与现代的冲突",
      application: "可以设定一个快速变革的社会，展现传统与现代的张力",
      worldConnection: "与世界观中的社会变革和现代化设定高度契合"
    },
    {
      title: "冷战",
      description: "20世纪下半叶美苏之间的意识形态对抗，影响了全球政治格局。",
      similarity: "涉及意识形态冲突、代理人战争和秘密斗争",
      application: "可以构建两大阵营对立的世界观，加入间谍和秘密行动元素",
      worldConnection: "与世界观中的阵营对立和秘密斗争设定完美契合"
    }
  ];

  // 过滤掉要避免的内容
  const filtered = allEvents.filter(e => !avoid.includes(e.title) && !generationHistory.includes(e.title));
  
  // 随机选择
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// 获取随机架空世界（避免重复）
function getRandomFictionalWorlds(count: number, avoid: string[] = []) {
  const allWorlds = [
    {
      title: "中土世界（魔戒）",
      description: "托尔金创造的奇幻世界，包含多个种族、丰富的历史传说和完整的语言体系。",
      similarity: "拥有完整的种族设定和历史传承",
      application: "可以借鉴其种族设定方法和历史叙事技巧，构建有深度的世界观",
      worldConnection: "与世界观中的多民族和历史传说设定深度契合"
    },
    {
      title: "维斯特洛大陆（冰与火之歌）",
      description: "乔治·R·R·马丁创造的中世纪奇幻世界，以复杂的政治斗争和多线叙事著称。",
      similarity: "注重政治权谋和人物刻画",
      application: "可以借鉴其多视角叙事和复杂的人物关系网络",
      worldConnection: "与世界观中的政治斗争和复杂人物关系设定完美契合"
    },
    {
      title: "厄拉科斯星（沙丘）",
      description: "弗兰克·赫伯特创造的沙漠星球，以香料贸易和生态主题为核心的科幻世界。",
      similarity: "具有独特的生态设定和资源争夺",
      application: "可以构建以特定资源或环境为核心的世界观设定",
      worldConnection: "与世界观中的资源争夺和生态设定直接相关"
    },
    {
      title: "霍格沃茨（哈利波特）",
      description: "J·K·罗琳创造的魔法学校，融合了现代社会与魔法世界的奇幻设定。",
      similarity: "现代与魔法的融合，丰富的魔法系统",
      application: "可以借鉴魔法与日常生活融合的设定方式",
      worldConnection: "与世界观中的魔法系统设定高度契合"
    },
    {
      title: "潘多拉星（阿凡达）",
      description: "詹姆斯·卡梅隆创造的外星生态世界，强调与自然的和谐共存。",
      similarity: "强调生态平衡和与自然的关系",
      application: "可以构建以自然和谐为主题的世界观",
      worldConnection: "与世界观中的自然生态设定深度契合"
    },
    {
      title: "基地（银河帝国）",
      description: "艾萨克·阿西莫夫创造的银河帝国，以心理史学和文明兴衰为主题。",
      similarity: "宏大的文明尺度和历史规律",
      application: "可以借鉴文明兴衰和历史规律的设定",
      worldConnection: "与世界观中的文明历史设定直接相关"
    },
    {
      title: "海拉尔王国（塞尔达传说）",
      description: "任天堂创造的奇幻世界，以勇者与魔王的永恒斗争为主题。",
      similarity: "经典的善恶对立，丰富的游戏化设定",
      application: "可以借鉴经典奇幻设定的现代化表达",
      worldConnection: "与世界观中的善恶斗争设定完美契合"
    },
    {
      title: "九重天（西游记）",
      description: "中国古代神话世界，包含天界、人间、地府的三界设定。",
      similarity: "多层世界结构，丰富的神话体系",
      application: "可以借鉴多层世界和神话体系的构建方式",
      worldConnection: "与世界观中的多层世界或神话设定深度契合"
    },
    {
      title: "荒坂未来（赛博朋克2077）",
      description: "CD Projekt Red创造的赛博朋克世界，高科技与低生活质量的反差。",
      similarity: "高科技与社会问题的结合，赛博朋克美学",
      application: "可以借鉴高科技与社会反差的设定方式",
      worldConnection: "与世界观中的科技设定高度相关"
    },
    {
      title: "纳尼亚王国",
      description: "C·S·刘易斯创造的奇幻世界，通过衣柜可以进入的神奇王国。",
      similarity: "现实与奇幻世界的连接，寓言式叙事",
      application: "可以借鉴现实与奇幻世界连接的设定",
      worldConnection: "与世界观中的多重世界设定完美契合"
    }
  ];

  // 过滤掉要避免的内容
  const filtered = allWorlds.filter(w => !avoid.includes(w.title) && !generationHistory.includes(w.title));
  
  // 随机选择
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// 获取随机情节片段（避免重复）
function getRandomPlotFragments(count: number, avoid: string[] = []) {
  const allFragments = [
    {
      title: "秘密会议",
      description: "在黑暗的地下室中，几位密谋者正在策划一场政变，烛光映照着他们紧张的面孔。",
      application: "可以作为故事的开场，引发后续的政治斗争和权力更迭",
      worldConnection: "与世界观中的政治阴谋设定直接相关"
    },
    {
      title: "神秘遗迹",
      description: "探险家在古老的废墟中发现了一扇刻有奇异符文的石门，门后似乎隐藏着古老的秘密。",
      application: "可以作为冒险故事的起点，引导角色探索未知的历史真相",
      worldConnection: "与世界观中的遗迹和古代秘密设定深度契合"
    },
    {
      title: "预言之子",
      description: "一个被预言选中的孩子在平凡的村庄中长大，却不知道自己肩负着改变世界的使命。",
      application: "可以作为成长故事的框架，展现主角从平凡到伟大的旅程",
      worldConnection: "与世界观中的预言和命运设定完美契合"
    },
    {
      title: "失窃的神器",
      description: "一件具有强大力量的神器被神秘人盗走，各方势力开始追踪它的下落。",
      application: "可以作为寻宝故事的主线，引入多方势力的争夺",
      worldConnection: "与世界观中的神器设定直接相关"
    },
    {
      title: "被遗忘的契约",
      description: "一个古老的契约在特定条件下重新激活，影响了当代人的命运。",
      application: "可以作为故事的核心驱动力，引出历史与现实的冲突",
      worldConnection: "与世界观中的古代魔法或契约设定深度契合"
    },
    {
      title: "边界哨所的失踪",
      description: "边境哨所的守卫突然全部失踪，只留下了奇怪的痕迹。",
      application: "可以作为悬疑故事的开场，引出对未知威胁的调查",
      worldConnection: "与世界观中的边境和未知威胁设定完美契合"
    },
    {
      title: "最后的守护者",
      description: "一个古老组织的最后一位守护者正在寻找继承人，传承重要的使命。",
      application: "可以作为传承故事的框架，探索责任与选择的主题",
      worldConnection: "与世界观中的秘密组织设定直接相关"
    },
    {
      title: "会说话的物品",
      description: "一件普通的物品突然开始说话，它似乎知道很多不该知道的秘密。",
      application: "可以作为奇幻元素的引入，增加故事的神秘感",
      worldConnection: "与世界观中的魔法物品设定深度契合"
    },
    {
      title: "时间裂隙",
      description: "某地出现了时间裂隙，不同时代的人和物开始出现。",
      application: "可以作为科幻/奇幻元素，探索时间和历史的主题",
      worldConnection: "与世界观中的时间或历史设定完美契合"
    },
    {
      title: "伪装的间谍",
      description: "一位间谍潜伏在重要位置多年，即将执行一项关键性任务。",
      application: "可以作为间谍故事的主线，增加紧张感和悬念",
      worldConnection: "与世界观中的间谍或秘密行动设定直接相关"
    },
    {
      title: "觉醒的力量",
      description: "一个普通人突然觉醒了特殊能力，引起了各方的注意。",
      application: "可以作为成长故事的起点，探索能力与责任的主题",
      worldConnection: "与世界观中的超能力设定深度契合"
    },
    {
      title: "即将到来的庆典",
      description: "一个重要的庆典即将举行，但有人计划利用这个机会搞破坏。",
      application: "可以作为事件的背景，增加紧张感和戏剧性",
      worldConnection: "与世界观中的文化或庆典设定完美契合"
    }
  ];

  // 过滤掉要避免的内容
  const filtered = allFragments.filter(f => !avoid.includes(f.title) && !generationHistory.includes(f.title));
  
  // 随机选择
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
