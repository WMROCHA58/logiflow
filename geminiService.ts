
import { GoogleGenAI, Type } from "@google/genai";
import { DeliveryData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `Você é a IA especializada LogiFlow Engine. Sua função é substituir qualquer OCR tradicional por uma extração inteligente e normalizada de etiquetas de pacotes.

INSTRUÇÕES TÉCNICAS:
1. EXTRAÇÃO: Identifique Nome, Endereço, Bairro, Cidade, País, CEP e Telefone.
2. NORMALIZAÇÃO: 
   - CEP: Formato 00000-000 para o Brasil ou formato local correspondente.
   - TELEFONE: Formate com DDD.
   - PAÍS: Se não estiver na etiqueta, infira pelo CEP ou contexto (ex: Brasil).
3. RESILIÊNCIA: Se a imagem estiver borrada ou o campo for ilegível, você DEVE preencher o campo com "desconhecido". Não invente dados.
4. RELATÓRIO: No campo 'passo_a_passo', forneça uma breve nota de 1 frase para o motorista (ex: "Endereço validado com sucesso" ou "Atenção: nome do destinatário ilegível").

RESPOSTA: Retorne APENAS o JSON. Sem explicações. Sem markdown.

ESTRUTURA JSON:
{
  "nome": "string",
  "endereco": "string",
  "bairro": "string",
  "cidade": "string",
  "pais": "string",
  "cep": "string",
  "telefone": "string",
  "passo_a_passo": "string"
}`;

export async function extractLabelData(base64Image: string): Promise<DeliveryData> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg'
            }
          },
          {
            text: `Analise a etiqueta e retorne o JSON estruturado.`
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nome: { type: Type.STRING },
            endereco: { type: Type.STRING },
            bairro: { type: Type.STRING },
            cidade: { type: Type.STRING },
            pais: { type: Type.STRING },
            cep: { type: Type.STRING },
            telefone: { type: Type.STRING },
            passo_a_passo: { type: Type.STRING }
          },
          required: ["nome", "endereco", "cidade", "cep", "passo_a_passo"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");

    return {
      ...data,
      timestamp: Date.now(),
      id: `LF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    } as DeliveryData;
  } catch (error) {
    console.error("LogiFlow Engine Error:", error);
    throw new Error("Falha na extração. Certifique-se de que a etiqueta está bem iluminada.");
  }
}
