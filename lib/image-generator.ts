export interface ImageGenerationOptions {
  prompt: string;
  style: MapStyle;
  detailLevel: 'low' | 'medium' | 'high';
  colorPreference: 'vibrant' | 'muted' | 'monochrome' | 'warm' | 'cool';
  emphasis: string[];
  resolution: '512x512' | '1024x1024' | '1024x1536' | '1536x1024' | '2048x2048';
}

export type MapStyle = 
  | 'medieval-hand-drawn'
  | 'watercolor'
  | 'sci-fi-fantasy'
  | 'minimalist'
  | 'dark-fantasy';

export interface ApiService {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  secretId?: string;
  secretKey?: string;
  freeQuota: number;
  costPerRequest: number;
  maxResolution: string;
  supportedStyles: MapStyle[];
}

export interface GenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  serviceUsed?: string;
  cost?: number;
}

export interface CostStats {
  totalRequests: number;
  totalCost: number;
  requestsByService: Record<string, number>;
  costByService: Record<string, number>;
}

const STYLE_TEMPLATES: Record<MapStyle, string> = {
  'medieval-hand-drawn': '中世纪幻想地图，手绘风格，羊皮纸纹理，详细的幻想世界地理，山脉、森林、河流、城堡、村庄、手绘边框，经典幻想制图风格',
  'watercolor': '水彩幻想地图，柔和色彩，艺术笔触，梦幻氛围，幻想世界风景，柔和渐变，空灵，绘画风格',
  'sci-fi-fantasy': '科幻幻想地图，数字全息风格，未来感边框，发光元素，赛博朋克美学，霓虹装饰，高科技标记，外星地形',
  'minimalist': '极简幻想地图，干净线条，简单形状，现代设计，扁平色彩，只有基本地理特征，优雅简洁',
  'dark-fantasy': '暗黑幻想地图，阴沉色彩，戏剧性光线，哥特元素，诡异氛围，暗色调，神秘地点，阴影边框'
};

const TENCENT_STYLE_MAPPING: Record<MapStyle, string> = {
  'medieval-hand-drawn': '写实风格',
  'watercolor': '水彩风格',
  'sci-fi-fantasy': '未来风格',
  'minimalist': '二次元',
  'dark-fantasy': '国风'
};

const COLOR_PREFERENCE_TAGS: Record<string, string[]> = {
  vibrant: ['鲜艳色彩', '大胆配色', '明亮', '饱和度高'],
  muted: ['柔和色彩', '柔和配色', '低饱和度', '微妙'],
  monochrome: ['单色调', '黑白', '灰度', '单一颜色'],
  warm: ['暖色调', '金色调', '日落配色', '橙色和红色点缀'],
  cool: ['冷色调', '蓝绿色调', '冰雪配色', '平静色调']
};

const DETAIL_LEVEL_TAGS: Record<string, string> = {
  low: '低细节，简化，基本形状',
  medium: '中等细节，平衡复杂度，清晰特征',
  high: '高细节，复杂，精细细节，高度细节，丰富纹理'
};

const RESOLUTION_MAP: Record<string, { width: number; height: number }> = {
  '512x512': { width: 512, height: 512 },
  '1024x1024': { width: 1024, height: 1024 },
  '1024x1536': { width: 1024, height: 1536 },
  '1536x1024': { width: 1536, height: 1024 },
  '2048x2048': { width: 1024, height: 1024 }
};

const COST_STORAGE_KEY = 'worldforge-image-cost-stats';

export class ImageGenerator {
  private services: ApiService[] = [];
  private currentServiceIndex = 0;

  constructor() {
    this.initializeServices();
    this.loadCostStats();
  }

  private initializeServices(): void {
    const stabilityApiKey = process.env.STABILITY_API_KEY || '';
    const replicateApiKey = process.env.REPLICATE_API_KEY || '';
    const tencentSecretId = process.env.TENCENT_SECRET_ID || '';
    const tencentSecretKey = process.env.TENCENT_SECRET_KEY || '';
    const dashscopeApiKey = process.env.DASHSCOPE_API_KEY || '';

    const allStyles: MapStyle[] = ['medieval-hand-drawn', 'watercolor', 'sci-fi-fantasy', 'minimalist', 'dark-fantasy'];
    
    this.services = [];

    if (dashscopeApiKey) {
      this.services.push({
        id: 'dashscope',
        name: '通义万相',
        baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        apiKey: dashscopeApiKey,
        freeQuota: 500,
        costPerRequest: 0.16,
        maxResolution: '2048x2048',
        supportedStyles: allStyles
      });
    }

    if (stabilityApiKey) {
      this.services.push({
        id: 'stability',
        name: 'Stability AI',
        baseUrl: 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        apiKey: stabilityApiKey,
        freeQuota: 100,
        costPerRequest: 0.0025,
        maxResolution: '2048x2048',
        supportedStyles: allStyles
      });
    }

    if (replicateApiKey) {
      this.services.push({
        id: 'replicate',
        name: 'Replicate SDXL',
        baseUrl: 'https://api.replicate.com/v1/predictions',
        apiKey: replicateApiKey,
        freeQuota: 50,
        costPerRequest: 0.008,
        maxResolution: '1024x1024',
        supportedStyles: allStyles
      });
    }
  }

  private costStats: CostStats = {
    totalRequests: 0,
    totalCost: 0,
    requestsByService: {},
    costByService: {}
  };

  private loadCostStats(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem(COST_STORAGE_KEY);
      if (saved) {
        this.costStats = JSON.parse(saved);
      }
    } catch {
      this.costStats = {
        totalRequests: 0,
        totalCost: 0,
        requestsByService: {},
        costByService: {}
      };
    }
  }

  private saveCostStats(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(COST_STORAGE_KEY, JSON.stringify(this.costStats));
  }

  private updateCostStats(serviceId: string, cost: number): void {
    this.costStats.totalRequests++;
    this.costStats.totalCost += cost;
    this.costStats.requestsByService[serviceId] = (this.costStats.requestsByService[serviceId] || 0) + 1;
    this.costStats.costByService[serviceId] = (this.costStats.costByService[serviceId] || 0) + cost;
    this.saveCostStats();
  }

  public getCostStats(): CostStats {
    return { ...this.costStats };
  }

  public estimateCost(options: ImageGenerationOptions): number {
    const service = this.getBestService(options);
    if (!service) return 0;
    
    return service.costPerRequest;
  }

  private getBestService(options: ImageGenerationOptions): ApiService | null {
    if (this.services.length === 0) return null;

    const suitableServices = this.services.filter(service => 
      service.supportedStyles.includes(options.style)
    );

    if (suitableServices.length === 0) {
      return this.services[0];
    }

    suitableServices.sort((a, b) => a.costPerRequest - b.costPerRequest);
    
    return suitableServices[0];
  }

  public buildPrompt(options: ImageGenerationOptions, worldDescription: string): string {
    const styleTemplate = STYLE_TEMPLATES[options.style];
    const colorTags = COLOR_PREFERENCE_TAGS[options.colorPreference] || [];
    const detailTag = DETAIL_LEVEL_TAGS[options.detailLevel];
    
    let prompt = `${styleTemplate}，${detailTag}，`;
    
    if (colorTags.length > 0) {
      prompt += `${colorTags.join('，')}，`;
    }
    
    if (options.emphasis && options.emphasis.length > 0) {
      const emphasisMap: Record<string, string> = {
        'mountains': '山脉',
        'forests': '森林',
        'rivers': '河流',
        'cities': '城市',
        'lakes': '湖泊',
        'deserts': '沙漠',
        'volcanoes': '火山',
        'glaciers': '冰川',
        'islands': '岛屿',
        'caves': '洞穴'
      };
      const chineseEmphasis = options.emphasis.map(e => emphasisMap[e] || e);
      prompt += `重点元素：${chineseEmphasis.join('、')}，`;
    }
    
    if (worldDescription && worldDescription.trim()) {
      // 直接使用世界观描述，让AI更好地理解整个世界观
      prompt += `世界观背景：${worldDescription.substring(0, 300)}，`;
      
      // 同时提取关键元素
      const keyElements = this.extractKeyElements(worldDescription);
      if (keyElements.length > 0) {
        prompt += `世界特征：${keyElements.join('、')}，`;
      }
    }
    
    prompt += '幻想世界地图，详细地理，俯视视角，地图边框，图例元素，专业制图';
    
    // 如果用户有自定义提示词，加在最后
    if (options.prompt && options.prompt.trim()) {
      prompt += `，${options.prompt}`;
    }
    
    return prompt.substring(0, 1500);
  }

  private extractKeyElements(text: string): string[] {
    const keywords: string[] = [];
    
    const terrainPatterns = [
      /(山脉|山峰|高原|平原|沙漠|森林|丛林|沼泽|湖泊|海洋|河流|瀑布|峡谷|火山|冰川|岛屿|洞穴)/gi,
      /(mountain|peak|plateau|plain|desert|forest|jungle|swamp|lake|ocean|river|waterfall|canyon|volcano|glacier|island|cave)/gi,
    ];
    
    const settlementPatterns = [
      /(城市|城堡|村庄|要塞|神殿|遗迹|港口|王国|帝国|宫殿|要塞|堡垒)/gi,
      /(city|castle|village|fortress|temple|ruins|port|kingdom|empire|palace|fort|stronghold)/gi,
    ];
    
    const fantasyElements = [
      /(魔法|龙|精灵|矮人|兽人|巫师|魔法塔|传送门|神庙|圣所|古迹|废墟)/gi,
      /(magic|dragon|elf|dwarf|orc|wizard|mage|portal|magic tower|shrine|sanctuary|monument|ruins)/gi,
    ];
    
    terrainPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        keywords.push(...matches.slice(0, 4));
      }
    });
    
    settlementPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        keywords.push(...matches.slice(0, 4));
      }
    });
    
    fantasyElements.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        keywords.push(...matches.slice(0, 3));
      }
    });
    
    return Array.from(new Set(keywords)).slice(0, 12);
  }

  public async generateImage(options: ImageGenerationOptions, worldDescription: string): Promise<GenerationResult> {
    const service = this.getBestService(options);
    if (!service) {
      return { success: false, error: '没有可用的图像生成服务' };
    }

    const prompt = this.buildPrompt(options, worldDescription);

    try {
      let result: GenerationResult;
      
      switch (service.id) {
        case 'dashscope':
          result = await this.callDashscopeApi(service, prompt, options);
          break;
        case 'tencent':
          result = await this.callTencentApi(service, prompt, options);
          break;
        case 'stability':
          result = await this.callStabilityApi(service, prompt, RESOLUTION_MAP[options.resolution]);
          break;
        case 'replicate':
          result = await this.callReplicateApi(service, prompt, RESOLUTION_MAP[options.resolution]);
          break;
        default:
          return { success: false, error: '不支持的服务类型' };
      }

      if (result.success && result.cost) {
        this.updateCostStats(service.id, result.cost);
      }

      return result;
    } catch (error) {
      console.error('Image generation failed:', error);
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  }

  private async callTencentApi(service: ApiService, prompt: string, options: ImageGenerationOptions): Promise<GenerationResult> {
    try {
      const response = await fetch('https://hunyuan.cloud.tencent.com/openapi/v1/text2image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TC-Action': 'SubmitTextToImageProTask',
          'X-TC-Version': '2023-09-01',
          'X-TC-Timestamp': Math.floor(Date.now() / 1000).toString(),
          'X-TC-Region': 'ap-guangzhou',
          'X-TC-SecretId': service.secretId || '',
          'X-TC-Signature': '',
          'Authorization': ''
        },
        body: JSON.stringify({
          Action: 'SubmitTextToImageProTask',
          Version: '2023-09-01',
          Prompt: prompt,
          Width: 1024,
          Height: 1024,
          ResultStyle: TENCENT_STYLE_MAPPING[options.style] || '写实风格',
          ReturnUrl: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `腾讯混元API请求失败: ${response.status} - ${errorText}` };
      }

      const data = await response.json();
      
      if (data.Response && data.Response.TaskId) {
        const taskId = data.Response.TaskId;
        
        for (let i = 0; i < 30; i++) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const statusResponse = await fetch('https://hunyuan.cloud.tencent.com/openapi/v1/text2image/query', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-TC-Action': 'QueryTextToImageProTask',
              'X-TC-Version': '2023-09-01',
              'X-TC-Timestamp': Math.floor(Date.now() / 1000).toString(),
              'X-TC-Region': 'ap-guangzhou',
              'X-TC-SecretId': service.secretId || ''
            },
            body: JSON.stringify({
              Action: 'QueryTextToImageProTask',
              Version: '2023-09-01',
              TaskId: taskId
            })
          });

          const statusData = await statusResponse.json();
          
          if (statusData.Response && statusData.Response.TaskStatus === 'Success') {
            const images = statusData.Response.Images || [];
            if (images.length > 0) {
              return {
                success: true,
                imageUrl: images[0].ImageUrl || images[0],
                serviceUsed: service.name,
                cost: service.costPerRequest
              };
            }
          } else if (statusData.Response && statusData.Response.TaskStatus === 'Failed') {
            return { success: false, error: statusData.Response.TaskStatusMessage || '生成失败' };
          }
        }

        return { success: false, error: '生成超时，请重试' };
      }

      if (data.Response && data.Response.Image) {
        return {
          success: true,
          imageUrl: data.Response.Image,
          serviceUsed: service.name,
          cost: service.costPerRequest
        };
      }

      return { success: false, error: '腾讯混元API返回格式错误' };
    } catch (error) {
      console.error('Tencent API error:', error);
      return { success: false, error: error instanceof Error ? error.message : '腾讯混元API调用失败' };
    }
  }

  private async callStabilityApi(service: ApiService, prompt: string, resolution: { width: number; height: number }): Promise<GenerationResult> {
    const response = await fetch(service.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${service.apiKey}`
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt, weight: 1.0 }],
        width: resolution.width,
        height: resolution.height,
        cfg_scale: 7,
        steps: 30,
        samples: 1
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'API请求失败' }));
      return { success: false, error: errorData.message || 'Stability API请求失败' };
    }

    const data = await response.json();
    
    if (data.artifacts && data.artifacts[0] && data.artifacts[0].base64) {
      const imageBase64 = data.artifacts[0].base64;
      return {
        success: true,
        imageUrl: `data:image/png;base64,${imageBase64}`,
        serviceUsed: service.name,
        cost: service.costPerRequest
      };
    }

    return { success: false, error: '未返回图像数据' };
  }

  private async callReplicateApi(service: ApiService, prompt: string, resolution: { width: number; height: number }): Promise<GenerationResult> {
    const response = await fetch(service.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${service.apiKey}`
      },
      body: JSON.stringify({
        version: '8a0149076608946e2e72688e10692596bc4e94293498742e5d64580a19697284',
        input: {
          prompt,
          width: resolution.width,
          height: resolution.height,
          num_inference_steps: 30,
          guidance_scale: 7
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'API请求失败' }));
      return { success: false, error: errorData.detail || 'Replicate API请求失败' };
    }

    const data = await response.json();
    
    if (data.urls && data.urls.get) {
      let completed = false;
      let attempts = 0;
      const maxAttempts = 30;

      while (!completed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const statusResponse = await fetch(data.urls.get, {
          headers: { 'Authorization': `Token ${service.apiKey}` }
        });
        
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'succeeded') {
          completed = true;
          return {
            success: true,
            imageUrl: statusData.output[0],
            serviceUsed: service.name,
            cost: service.costPerRequest
          };
        } else if (statusData.status === 'failed') {
          return { success: false, error: statusData.error || '生成失败' };
        }
        
        attempts++;
      }

      return { success: false, error: '请求超时' };
    }

    return { success: false, error: '未返回图像URL' };
  }

  private async callDashscopeApi(service: ApiService, prompt: string, options: ImageGenerationOptions): Promise<GenerationResult> {
    try {
      const resolution = RESOLUTION_MAP[options.resolution];
      
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${service.apiKey}`,
          'X-DashScope-Async': 'enable'
        },
        body: JSON.stringify({
          model: 'wanx-v1',
          input: {
            prompt: prompt,
            negative_prompt: 'text, watermark, blurry, low quality, distorted, bad anatomy'
          },
          parameters: {
            size: `${resolution.width}*${resolution.height}`,
            n: 1,
            seed: Math.floor(Math.random() * 4294967295)
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `通义万相API请求失败: ${response.status} - ${errorText}` };
      }

      const data = await response.json();
      
      if (data.output && data.output.task_id) {
        const taskId = data.output.task_id;
        
        for (let i = 0; i < 60; i++) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const statusResponse = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
            headers: {
              'Authorization': `Bearer ${service.apiKey}`
            }
          });

          const statusData = await statusResponse.json();
          
          if (statusData.output && statusData.output.task_status === 'SUCCEEDED') {
            const results = statusData.output.results || [];
            if (results.length > 0 && results[0].url) {
              return {
                success: true,
                imageUrl: results[0].url,
                serviceUsed: service.name,
                cost: service.costPerRequest
              };
            }
          } else if (statusData.output && statusData.output.task_status === 'FAILED') {
            return { success: false, error: statusData.output.error || '生成失败' };
          } else if (statusData.output && statusData.output.task_status === 'PENDING') {
            continue;
          } else if (statusData.output && statusData.output.task_status === 'RUNNING') {
            continue;
          }
        }

        return { success: false, error: '生成超时，请重试' };
      }

      if (data.output && data.output.results && data.output.results.length > 0) {
        return {
          success: true,
          imageUrl: data.output.results[0].url,
          serviceUsed: service.name,
          cost: service.costPerRequest
        };
      }

      return { success: false, error: '通义万相API返回格式错误' };
    } catch (error) {
      console.error('Dashscope API error:', error);
      return { success: false, error: error instanceof Error ? error.message : '通义万相API调用失败' };
    }
  }
}
