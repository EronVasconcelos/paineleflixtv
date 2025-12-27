
import { GoogleGenAI } from "@google/genai";
import { Client } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Always use { apiKey: process.env.API_KEY } for initialization.
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateRenewalMessage(client: Client): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Escreva uma mensagem de cobrança amigável e profissional pelo WhatsApp para um cliente de IPTV chamado ${client.name}. O plano dele (${client.packageName}) vence em ${new Date(client.expiresAt).toLocaleDateString('pt-BR')}. O valor é R$ ${client.price.toFixed(2)}. Inclua um senso de urgência leve para não perder o acesso, mas mantenha a cordialidade. Apenas o texto da mensagem.`,
        config: {
          temperature: 0.7,
        }
      });
      // Use .text property to get the generated content.
      return response.text || "Olá! Gostaria de lembrar que sua assinatura está próxima do vencimento. Entre em contato para renovar.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Olá! Sua assinatura IPTV está vencendo. Vamos renovar?";
    }
  }

  async analyzeBusiness(clients: Client[]): Promise<string> {
    try {
      const dataSummary = JSON.stringify(clients.map(c => ({
        status: c.status,
        value: c.price,
        expiry: c.expiresAt
      })));

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise estes dados de clientes de IPTV e me dê 3 dicas rápidas para aumentar o faturamento ou reduzir cancelamentos. Dados: ${dataSummary}`,
        config: {
          temperature: 0.5,
        }
      });
      // Use .text property to get the generated content.
      return response.text || "Continue focado no atendimento ao cliente para reduzir o churn.";
    } catch (error) {
      return "Dica: Mantenha seus clientes ativos informados sobre novos conteúdos.";
    }
  }
}

export const geminiService = new GeminiService();
