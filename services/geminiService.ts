
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

const getStockDeclaration: FunctionDeclaration = {
  name: 'get_stock',
  description: 'Obtiene el estado actual real del stock.',
  parameters: { type: Type.OBJECT, properties: {} }
};

const updateStockDeclaration: FunctionDeclaration = {
  name: 'update_stock',
  description: 'Actualiza el stock de un filamento específico.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      color: { type: Type.STRING },
      type: { type: Type.STRING, enum: ['PLA', 'PET-G'] },
      closedCount: { type: Type.NUMBER },
      openCount: { type: Type.NUMBER }
    },
    required: ['color', 'type']
  }
};

const calculateBudgetDeclaration: FunctionDeclaration = {
  name: 'calculate_budget',
  description: 'Calcula el precio de impresión basándose en el peso, tipo de cliente, material, tiempo de diseño, post-procesado y costo del modelo comprado.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      weight: { type: Type.NUMBER },
      clientType: { type: Type.STRING, enum: ['minorista', 'mayorista'] },
      filamentType: { type: Type.STRING, enum: ['PLA', 'PET-G'] },
      designMinutes: { type: Type.NUMBER, description: 'Tiempo de diseño personalizado en minutos.' },
      postProcessMinutes: { type: Type.NUMBER, description: 'Tiempo de post-procesado (lijado, pintado) en minutos.' },
      modelCost: { type: Type.NUMBER, description: 'Costo del modelo 3D comprado en plataformas como Cults3D.' }
    },
    required: ['weight', 'clientType', 'filamentType']
  }
};

export async function suggestPriceItemsFromSales(salesItems: { description: string, price: number }[]): Promise<any[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
Eres un asistente experto en analizar ventas y generar listas de precios genéricas.
Analiza la siguiente lista de items vendidos. Tu tarea es:
1. Agrupar items similares en nombres genéricos. Por ejemplo, "topper de torta de mickey" y "topper de torta pato donald" deberian agruparse en "Topper de torta de personaje".
2. Determinar un "Precio Mayorista" basado en el precio encontrado para ese tipo de items en las ventas (toma el precio máximo o más representativo encontrado).
3. Calcular el "Precio Minorista" aumentándole al mayorista un 20% y redondeando hacia arriba.
4. Establecer la "Cantidad mínima mayorista" siempre a 5 por defecto.

A continuación, los items vendidos:
${JSON.stringify(salesItems, null, 2)}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              wholesalePrice: { type: Type.NUMBER },
              retailPrice: { type: Type.NUMBER },
              wholesaleMinQuantity: { type: Type.NUMBER }
            },
            required: ["description", "wholesalePrice", "retailPrice", "wholesaleMinQuantity"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Error generating price suggestions:", error);
    throw error;
  }
}

export class SinapsisBotService {

  constructor(
    private stock: any[], 
    private orders: any[], 
    private prices: { pla: number, petg: number, design: number, postProcess: number },
    private onStateChange: (newState: { stock?: any[], orders?: any[] }) => void
  ) {}

  async sendMessage(message: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{
          functionDeclarations: [
            getStockDeclaration,
            updateStockDeclaration,
            calculateBudgetDeclaration
          ]
        }]
      }
    });

    try {
      let result = await chat.sendMessage({ message });
      
      if (result.functionCalls) {
        const toolResponses: any[] = [];
        
        for (const call of result.functionCalls) {
          let responseData;
          
          if (call.name === 'get_stock') {
            const stockReport = this.stock.map(s => {
              const min = s.type === 'PET-G' ? 1 : (s.color === 'Blanco' || s.color === 'Negro' ? 3 : 1);
              return `COLOR: ${s.color} | TIPO: ${s.type} | CERRADOS: ${s.closedCount} | MINIMO: ${min} | STATUS: ${s.closedCount < min ? 'FALTA' : 'OK'}`;
            }).join('\n');
            responseData = { result: stockReport };
          } else if (call.name === 'calculate_budget') {
            const { weight, clientType, filamentType, designMinutes = 0, postProcessMinutes = 0, modelCost = 0 } = call.args as any;
            const currentPrice = filamentType === 'PET-G' ? this.prices.petg : this.prices.pla;
            
            const costPerGram = currentPrice / 1000;
            const materialCost = costPerGram * weight;
            const baseCost = materialCost * 1.4;
            const multiplier = clientType === 'minorista' ? 4 : 3;
            const printingPrice = Math.round((baseCost * multiplier) / 100) * 100;
            
            const designCost = (this.prices.design / 60) * designMinutes;
            const postProcessCost = (this.prices.postProcess / 60) * postProcessMinutes;
            const finalPrice = printingPrice + designCost + postProcessCost + modelCost;
            
            responseData = { 
              result: { 
                finalPrice, 
                printingPrice,
                designCost,
                postProcessCost,
                modelCost,
                details: `Calculado para ${weight}g (${clientType}) en ${filamentType}. Diseño: ${designMinutes}m, Post: ${postProcessMinutes}m, Modelo: $${modelCost}.` 
              } 
            };
          }

          toolResponses.push({
            id: call.id,
            name: call.name,
            response: responseData
          });
        }

        const finalResult = await chat.sendMessage({
          message: "Generá la respuesta final detallando: Impresión, Diseño, Post-procesado, Costo del modelo y el total final."
        });
        return finalResult.text;
      }

      return result.text;
    } catch (err) {
      console.error("SinapsisBot Error:", err);
      throw err;
    }
  }
}
