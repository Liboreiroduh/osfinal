interface OCRResult {
  merchant: string;
  amount: number;
  date: number;
  category: string;
}

// Simulated OCR service - in production, this would call an AI API
class OCRService {
  async analyzeReceipt(imageBase64: string): Promise<{
    success: boolean;
    data?: OCRResult;
    error?: string;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulated extraction - in production, this would use an AI model
    const mockResults: OCRResult[] = [
      { merchant: 'Posto Shell', amount: 150.00, date: Date.now(), category: 'COMBUSTIVEL' },
      { merchant: 'Restaurante Bom Prato', amount: 45.90, date: Date.now(), category: 'ALIMENTACAO' },
      { merchant: 'Hotel Ibis', amount: 280.00, date: Date.now(), category: 'HOSPEDAGEM' },
      { merchant: 'AutoBAn', amount: 32.00, date: Date.now(), category: 'PEDAGIO' },
      { merchant: 'Eletrômega', amount: 125.50, date: Date.now(), category: 'MATERIAL' },
      { merchant: 'Estacionamento Central', amount: 25.00, date: Date.now(), category: 'OUTROS' },
    ];

    // Random result for simulation
    const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];

    return {
      success: true,
      data: randomResult,
    };
  }
}

export const ocrService = new OCRService();
