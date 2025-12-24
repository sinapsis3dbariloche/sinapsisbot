
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
  description: 'Calcula el precio de impresión basándose en el peso, tipo de cliente, material y tiempo de diseño.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      weight: { type: Type.NUMBER },
      clientType: { type: Type.STRING, enum: ['minorista', 'mayorista'] },
      filamentType: { type: Type.STRING, enum: ['PLA', 'PET-G'] },
      designMinutes: { type: Type.NUMBER, description: 'Tiempo de diseño personalizado en minutos. Por defecto 0.' }
    },
    required: ['weight', 'clientType', 'filamentType']
  }
};

export class SinapsisBotService {
  constructor(
    private stock: any[], 
    private orders: any[], 
    private prices: { pla: number, petg: number, design: number },
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
            const { weight, clientType, filamentType, designMinutes = 0 } = call.args as any;
            const currentPrice = filamentType === 'PET-G' ? this.prices.petg : this.prices.pla;
            
            const costPerGram = currentPrice / 1000;
            const materialCost = costPerGram * weight;
            const baseCost = materialCost * 1.4;
            const multiplier = clientType === 'minorista' ? 4 : 3;
            const printingPrice = Math.round((baseCost * multiplier) / 100) * 100;
            
            const designCost = (this.prices.design / 60) * designMinutes;
            const finalPrice = printingPrice + designCost;
            
            responseData = { 
              result: { 
                finalPrice, 
                printingPrice,
                designCost,
                details: `Calculado para ${weight}g (${clientType}) en ${filamentType} con ${designMinutes} min de diseño. Costo $/kg: ${currentPrice}, $/hr diseño: ${this.prices.design}` 
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
          message: "Generá la respuesta final con el presupuesto calculado detallando el costo de impresión y el costo de diseño si corresponde."
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
