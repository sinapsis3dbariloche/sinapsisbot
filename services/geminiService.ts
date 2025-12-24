
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const getStockDeclaration: FunctionDeclaration = {
  name: 'get_stock',
  description: 'Obtiene la lista actual de stock de filamentos (rollos cerrados y abiertos).',
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

const getOrdersDeclaration: FunctionDeclaration = {
  name: 'get_orders',
  description: 'Obtiene la lista de pedidos en la cola de producción.',
  parameters: { type: Type.OBJECT, properties: {} }
};

const addOrderDeclaration: FunctionDeclaration = {
  name: 'add_order',
  description: 'Registra un nuevo pedido en la cola.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      customer: { type: Type.STRING },
      details: { type: Type.STRING },
      priority: { type: Type.STRING, enum: ['Alta', 'Media', 'Baja'] }
    },
    required: ['customer', 'details']
  }
};

export class SinapsisBotService {
  private chat;

  constructor(
    private stock: any[], 
    private orders: any[], 
    private onStateChange: (newState: { stock?: any[], orders?: any[] }) => void
  ) {
    this.chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{
          functionDeclarations: [
            getStockDeclaration,
            updateStockDeclaration,
            getOrdersDeclaration,
            addOrderDeclaration
          ]
        }]
      }
    });
  }

  async sendMessage(message: string) {
    const result = await this.chat.sendMessage({ message });
    
    if (result.functionCalls) {
      const toolResponses: any[] = [];
      
      for (const call of result.functionCalls) {
        let response;
        if (call.name === 'get_stock') {
          response = { result: this.stock };
        } else if (call.name === 'update_stock') {
          const args = call.args as any;
          const updatedStock = this.stock.map(s => {
            if (s.color.toLowerCase() === args.color.toLowerCase() && s.type === args.type) {
              return { 
                ...s, 
                closedCount: args.closedCount !== undefined ? args.closedCount : s.closedCount,
                openCount: args.openCount !== undefined ? args.openCount : s.openCount
              };
            }
            return s;
          });
          this.onStateChange({ stock: updatedStock });
          response = { result: "Stock actualizado che! Quedó registrado el cambio. ✅" };
        } else if (call.name === 'get_orders') {
          response = { result: this.orders };
        } else if (call.name === 'add_order') {
          const { customer, details, priority = 'Media' } = call.args as any;
          const newOrder = {
            id: 'o' + Math.random().toString(36).substr(2, 4),
            customer,
            details,
            status: 'Pendiente',
            priority,
            createdAt: new Date().toISOString().split('T')[0]
          };
          const updatedOrders = [newOrder, ...this.orders];
          this.onStateChange({ orders: updatedOrders });
          response = { result: "Pedido anotado! Lo puse como pendiente 🖨️" };
        }

        toolResponses.push({
          id: call.id,
          name: call.name,
          response
        });
      }

      const finalResult = await this.chat.sendMessage({
        message: "Operación completada con éxito." 
      });

      return finalResult.text;
    }

    return result.text;
  }
}
