import { NextResponse } from 'next/server';
import { ImageGenerator, ImageGenerationOptions } from '../../../lib/image-generator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { options, worldDescription }: { options: ImageGenerationOptions; worldDescription: string } = body;

    const generator = new ImageGenerator();
    const result = await generator.generateImage(options, worldDescription);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Image generation API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const generator = new ImageGenerator();
    const stats = generator.getCostStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}