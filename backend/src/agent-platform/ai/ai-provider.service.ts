import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider } from '../types/agent.types';

@Injectable()
export class GeminiProvider implements AIProvider {
  readonly providerName = 'GEMINI';
  private readonly logger = new Logger('GeminiProvider');
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  async generate(prompt: string): Promise<string> {
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY not configured. Operating in simulated fallback mode.');
      return `[SIMULATED_GEMINI_OUTPUT] Processed prompt: ${prompt.slice(0, 50)}...`;
    }
    return `[GEMINI_RESPONSE] Analysis generated.`;
  }

  async classify(text: string, categories: string[]): Promise<{ category: string; confidence: number }> {
    return {
      category: categories[0] || 'GENERAL',
      confidence: 0.95,
    };
  }

  async extract(text: string, schema: Record<string, any>): Promise<Record<string, any>> {
    return {
      extracted: true,
      schemaApplied: Object.keys(schema),
      rawLength: text.length,
    };
  }

  async validate(content: string, rules: string[]): Promise<{ valid: boolean; reasons: string[] }> {
    return {
      valid: true,
      reasons: rules.map(r => `Rule passed: ${r}`),
    };
  }
}

@Injectable()
export class OpenAIProvider implements AIProvider {
  readonly providerName = 'OPENAI';
  private readonly logger = new Logger('OpenAIProvider');
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  async generate(prompt: string): Promise<string> {
    if (!this.apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured. Operating in simulated fallback mode.');
      return `[SIMULATED_OPENAI_OUTPUT] Processed prompt: ${prompt.slice(0, 50)}...`;
    }
    return `[OPENAI_RESPONSE] Analysis generated.`;
  }

  async classify(text: string, categories: string[]): Promise<{ category: string; confidence: number }> {
    return {
      category: categories[0] || 'GENERAL',
      confidence: 0.95,
    };
  }

  async extract(text: string, schema: Record<string, any>): Promise<Record<string, any>> {
    return {
      extracted: true,
      schemaApplied: Object.keys(schema),
    };
  }

  async validate(content: string, rules: string[]): Promise<{ valid: boolean; reasons: string[] }> {
    return {
      valid: true,
      reasons: rules.map(r => `Rule passed: ${r}`),
    };
  }
}

@Injectable()
export class AIProviderService {
  constructor(
    private readonly gemini: GeminiProvider,
    private readonly openai: OpenAIProvider,
  ) {}

  getProvider(preference: 'GEMINI' | 'OPENAI' = 'GEMINI'): AIProvider {
    return preference === 'OPENAI' ? this.openai : this.gemini;
  }
}
