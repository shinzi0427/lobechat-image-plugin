import { NextRequest, NextResponse } from "next/server";
import {
  createErrorResponse,
  getPluginSettingsFromRequest,
  PluginErrorType,
} from "@lobehub/chat-plugin-sdk";
import axios from "axios";
import { IXAIImageGenerationResponse, Settings } from "@/type"; // 导入更新后的接口

// xAI的API基础URL
const BASE_URL = "https://api.x.ai/v1";

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
    const apiKey = settings.XAI_API_KEY;
    if (!apiKey) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: "xAI API key is required.",
      });
    }

    // 3. 从请求体中获取参数
    const body = await req.json();
    const { prompt, model, n, response_format } = body;

    // 参数校验
    if (!prompt) {
      return NextResponse.json(
        { message: "Prompt is required." },
        { status: 400 },
      );
    }

    // 4. 构建请求体
    const requestBody = {
      model: model || "grok-2-image", // 默认使用grok-2-image
      prompt: prompt,
      n: n || 1, // 默认生成1张图片
      response_format: response_format || "url" // 默认返回URL
    };

    // 5. 发送请求到xAI的API
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
          message: "Invalid xAI API key.",
        });
      }
      console.error("Failed to generate image:", response.data);
      return NextResponse.json(
        { message: "Failed to generate image." },
        { status: response.status },
      );
    }

    // 7. 解析响应数据
    const respData: IXAIImageGenerationResponse = response.data;
    
    // 构建Markdown响应
    let markdownResponse = "";
    
    // 首先添加所有图片
    for (let i = 0; i < respData.data.length; i++) {
      const imageData = respData.data[i];
      let imageUrl;
      
      // 根据response_format确定如何处理图片数据
      if (response_format === "b64_json" && imageData.b64_json) {
        // 如果是Base64格式，直接在Markdown中使用
        imageUrl = imageData.b64_json;
        if (!imageUrl.startsWith("data:")) {
          imageUrl = `data:image/jpeg;base64,${imageUrl}`;
        }
      } else if (imageData.url) {
        // 使用返回的URL
        imageUrl = imageData.url;
      } else {
        console.error("No image data found in response:", imageData);
        continue;
      }
      
      // 只添加图片，不添加提示词
      markdownResponse += `![Generated Image ${i+1}](${imageUrl})`;
      
      // 如果有多张图片，添加分隔符
      if (i < respData.data.length - 1) {
        markdownResponse += "\n\n";
      }
    }
    
    // 如果没有成功生成任何图片
    if (!markdownResponse) {
      return NextResponse.json(
        { message: "Failed to generate any images." },
        { status: 500 },
      );
    }
    
    // 在所有图片之后，添加一次原始提示词和修订后提示词
    // 使用第一张图片的修订后提示词（通常多张图片使用相同的提示词）
    if (respData.data.length > 0 && respData.data[0].revised_prompt) {
      markdownResponse += `\n\n*原始提示词: ${prompt}*\n\n*修订后提示词: ${respData.data[0].revised_prompt}*`;
    }

    // 9. 返回响应给客户端
    return NextResponse.json({ markdownResponse });
  } catch (error) {
    console.error("Error generating image:", error);
    let status = 500;
    let message = "Failed to generate image.";
    
    if (axios.isAxiosError(error)) {
      status = error.response?.status || 500;
      message = error.response?.data?.message || message;
    }
    
    return NextResponse.json(
      { message },
      { status },
    );
  }
}
