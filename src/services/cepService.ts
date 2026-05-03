 import ApiService, { ApiRequestOptions } from "./apiService";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface CepResponse {
   cep: string;
   logradouro: string;
   complemento: string;
   bairro: string;
   localidade: string;
   uf: string;
   ibge: string;
   gia: string;
   ddd: string;
   siafi: string;
   error?: boolean;
 }
 
 class CepService extends ApiService {
   async buscarCep(cep: string, options?: ApiRequestOptions): Promise<CepResponse | null> {
     const sanitizedCep = cep.replace(/\D/g, "");
     if (sanitizedCep.length !== 8) return null;
 
     // Try ViaCEP first
     try {
       const response = await fetch(`https://viacep.com.br/ws/${sanitizedCep}/json/`);
       const data = await response.json();
 
       await this.logRequest(
         "viacep",
         "cep",
         `https://viacep.com.br/ws/${sanitizedCep}/json/`,
         "GET",
         response.status,
         !data.erro,
         data.erro ? "CEP não encontrado" : undefined,
         options
       );
 
       if (!data.erro) return data;
     } catch (error) {
       await this.logRequest(
         "viacep",
         "cep",
         `https://viacep.com.br/ws/${sanitizedCep}/json/`,
         "GET",
         500,
         false,
         error instanceof Error ? error.message : "Network error",
         options
       );
     }
 
     // Fallback to BrasilAPI
     try {
       const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${sanitizedCep}`);
       const data = await response.json();
 
       await this.logRequest(
         "brasilapi",
         "cep",
         `https://brasilapi.com.br/api/cep/v1/${sanitizedCep}`,
         "GET",
         response.status,
         response.ok,
         response.ok ? undefined : data.message,
         options
       );
 
       if (response.ok) {
         return {
           cep: data.cep,
           logradouro: data.street,
           bairro: data.neighborhood,
           localidade: data.city,
           uf: data.state,
           complemento: "",
           ibge: "",
           gia: "",
           ddd: "",
           siafi: "",
         };
       }
     } catch (error) {
       await this.logRequest(
         "brasilapi",
         "cep",
         `https://brasilapi.com.br/api/cep/v1/${sanitizedCep}`,
         "GET",
         500,
         false,
         error instanceof Error ? error.message : "Network error",
         options
       );
     }
 
     return null;
   }
 }
 
 export const cepService = new CepService();