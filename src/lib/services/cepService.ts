interface CEPResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
}

class CEPService {
  async searchByCEP(cep: string): Promise<{
    success: boolean;
    data?: {
      state: string;
      city: string;
      addressLine1: string;
      district: string;
      zipCode: string;
    };
    error?: string;
  }> {
    try {
      // Clean CEP
      const cleanCEP = cep.replace(/\D/g, '');
      
      if (cleanCEP.length !== 8) {
        return { success: false, error: 'CEP deve conter 8 dígitos' };
      }

      // Try BrasilAPI
      const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCEP}`);
      
      if (!response.ok) {
        return { success: false, error: 'CEP não encontrado' };
      }

      const data: CEPResponse = await response.json();

      return {
        success: true,
        data: {
          state: data.state,
          city: data.city,
          addressLine1: data.street || '',
          district: data.neighborhood || '',
          zipCode: data.cep,
        },
      };
    } catch (error) {
      return { success: false, error: 'Erro ao buscar CEP. Verifique sua conexão.' };
    }
  }
}

export const cepService = new CEPService();
