/**
 * @description: This file contains all the typescript interfaces used in the application, for SiliconFlow Image Generation.
 */

// Image Generation API Response
export interface ISiliconFlowImageGenerationResponse {
  images: {
    url: string;
  }[];
  timings: {
    inference: number; // 推理耗时（单位：毫秒）
  };
  seed: number; // 使用的随机种子
}

// Settings Interface
export interface Settings {
  SILICONFLOW_API_KEY: string; // SiliconFlow API的Bearer Token
}

// Request Parameters Interface
export interface ISiliconFlowImageGenerationRequest {
  model: string; // 模型名称，必填
  prompt: string; // 文本提示，必填
  negative_prompt?: string; // 负向提示，可选
  image_size: string; // 图像尺寸，必填，格式为 "宽x高"
  seed?: number; // 随机种子，可选，范围：0 < x < 9999999999
  num_inference_steps?: number; // 推理步数，可选，范围：1 <= x <= 50，默认值为 20
}