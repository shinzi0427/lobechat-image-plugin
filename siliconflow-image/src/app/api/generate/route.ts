import { NextRequest, NextResponse } from "next/server";
import {
  createErrorResponse,
  getPluginSettingsFromRequest,
  PluginErrorType,
} from "@lobehub/chat-plugin-sdk";
import axios from "axios";
import { ISiliconFlowImageGenerationResponse, Settings } from "@/type"; // 导入更新后的接口

// SiliconFlow的API基础URL
const BASE_URL = "https://api.siliconflow.cn/v1";

export async function POST(req: NextRequest) {
  try {
    // 1. 从请求中获取插件设置
    const settings = getPluginSettingsFromRequest<Settings>(req);
    if (!settings) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: "Plugin settings not found.",
      });
    }

    // 2. 获取API Key
    const apiKey = settings.SILICONFLOW_API_KEY;
    if (!apiKey) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: "SiliconFlow API key is required.",
      });
    }

    // 3. 从请求体中获取参数
    const body = await req.json();
    const { 
      prompt, 
      model = "black-forest-labs/FLUX.1-schnell", 
      image_size = "1024x1024", 
      negative_prompt,
      seed,
      num_inference_steps
    } = body;

    // 参数校验
    if (!prompt) {
      return NextResponse.json(
        { message: "Prompt is required." },
        { status: 400 },
      );
    }

    // 4. 构建请求体
    const requestBody: any = {
      model,
      prompt,
      image_size
    };

    // 添加可选参数
    if (negative_prompt) requestBody.negative_prompt = negative_prompt;
    if (seed) requestBody.seed = seed;
    if (num_inference_steps) requestBody.num_inference_steps = num_inference_steps;

    // 5. 发送请求到SiliconFlow的API
    const response = await axios.post(
      `${BASE_URL}/images/generations`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    // 6. 检查请求是否成功
    if (response.status !== 200) {
      if (response.status === 401) {
        return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
          message: "Invalid SiliconFlow API key.",
        });
      }
      console.error("Failed to generate image:", response.data);
      return NextResponse.json(
        { message: "Failed to generate image." },
        { status: response.status },
      );
    }

    // 7. 解析响应数据
    const respData: ISiliconFlowImageGenerationResponse = response.data;

    const imageUrl = respData.images[0]?.url;
    if (!imageUrl) {
      console.error("imageUrl is empty:", response.data);
      return NextResponse.json(
        { message: "Failed to generate image, imageUrl is empty." },
        { status: 500 },
      );
    }

    // 8. 构建Markdown响应
    const markdownResponse = `
![Generated Image](${imageUrl})
*提示词: ${prompt}*
*模型: ${model}*
*推理时间: ${respData.timings.inference}ms*
*种子: ${respData.seed}*
*注意: 图片链接有效期为1小时，请及时保存*
`.trim();

    // 9. 返回响应给客户端
    return NextResponse.json({ markdownResponse });
  } catch (error) {
    console.error("Error generating image:", error);
    let status = 500;
    if (axios.isAxiosError(error)) {
      status = error.response?.status || 500;
    }
    return NextResponse.json(
      { message: "Failed to generate image." },
      { status: status },
    );
  }
}