/**
 * @description: This file contains all the typescript interfaces used in the application, for ZhipuAI Image Generation.
 */

// Image Generation API Response
export interface IZhipuAIImageGenerationResponse {
	created: number;
	data: {
	  url: string;
	}[];
	content_filter?: {
	  // content_filter是可选的
	  role: string;
	  level: number;
	}[];
  }
  
  // Settings Interface
  export interface Settings {
	ZHIPUAI_API_KEY: string; // 假设你在设置中让用户填写智谱AI的API Key
  }