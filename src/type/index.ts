/**
 * @description: This file contains all the typescript interfaces used in the application, for xAI Image Generation.
 */

// Image Generation API Response
export interface IXAIImageGenerationResponse {
	created: number;
	data: Array<{
	  url?: string;           // 当response_format为"url"时返回
	  b64_json?: string;      // 当response_format为"b64_json"时返回
	  revised_prompt: string; // xAI会返回修订后的prompt
	}>;
  }
  
  // Settings Interface
  export interface Settings {
	XAI_API_KEY: string; // 用户需要填写xAI的API Key
  }
  
  // Request Parameters Interface
  export interface IXAIImageGenerationRequest {
	model: string;           // 模型名称，目前为"grok-2-image"
	prompt: string;          // 用于生成图片的文本描述
	n?: number;              // 生成图像的数量，范围1-10，默认为1
	response_format?: string; // 返回格式，"url"或"b64_json"，默认为"url"
  }