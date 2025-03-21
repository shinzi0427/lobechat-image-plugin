import { NextRequest, NextResponse } from "next/server";
import {
  createErrorResponse,
  getPluginSettingsFromRequest,
  PluginErrorType,
} from "@lobehub/chat-plugin-sdk";
import axios from "axios";
import { IZhipuAIImageGenerationResponse, Settings } from "@/type"; // 导入接口

// 智谱AI的API基础URL, 可以选择从环境变量读取，也可以设置成常量
const BASE_URL =
  process.env.ZHIPUAI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";

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
    const apiKey = settings.ZHIPUAI_API_KEY;
    if (!apiKey) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: "ZhipuAI API key is required.",
      });
    }

    // 3. 从请求体中获取prompt等参数
    const body = await req.json();
    const { prompt, size, user_id, model } = body; // 获取 model 参数

    // 参数校验
//    if (!prompt) {
//      return NextResponse.json(
//        { message: "Prompt is required." },
//        { status: 400 },
//      );
//    }
//    if (!model) {
//        return NextResponse.json(
//          { message: "Model is required." },
//          { status: 400 },
//        );
//    }
//     if (!["cogview-3-flash", "cogview-3", "cogview-3-plus"].includes(model)) {
//        return NextResponse.json(
//          { message: "Invalid model value." },
//          { status: 400 },
//        );
//      }
//
    // 4. 构建请求体
    const requestBody = {
      model: model, // 使用传入的 model
      prompt: prompt,
      size: size || "1024x1024",
      user_id: user_id,
    };

    // 5. 发送请求到智谱AI的API
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
          message: "Invalid ZhipuAI API key.",
        });
      }
      console.error("Failed to generate image:", response.data);
      return NextResponse.json(
        { message: "Failed to generate image." },
        { status: response.status },
      );
    }

    // 7. 解析响应数据
    const respData: IZhipuAIImageGenerationResponse = response.data;

    const imageUrl = respData.data[0].url;
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
*尺寸: ${size}*
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
