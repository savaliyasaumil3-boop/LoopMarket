// Porter API Service - Real Implementation
import axios from 'axios';

const PORTER_API_BASE = 'https://pfe-apigw-uat.porter.in'; // UAT environment
const PORTER_API_KEY = import.meta.env.VITE_PORTER_API_KEY || '';

export interface PorterAddress {
  apartment_address?: string;
  street_address1: string;
  street_address2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  lat?: number;
  lng?: number;
  contact_details: {
    name: string;
    phone_number: string;
  };
}

export interface PorterQuoteRequest {
  pickup_details: PorterAddress;
  drop_details: PorterAddress;
  customer: {
    name: string;
    mobile: {
      country_code: string;
      number: string;
    };
  };
}

export interface PorterOrderRequest extends PorterQuoteRequest {
  request_id: string;
  delivery_instructions?: {
    instructions_list: string[];
  };
}

class PorterAPIService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = PORTER_API_KEY;
    this.baseURL = PORTER_API_BASE;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-API-KEY': this.apiKey,
    };
  }

  // Step 1: Get Quote for available vehicles
  async getQuote(data: PorterQuoteRequest) {
    try {
      const response = await axios.post(
        `${this.baseURL}/v1/get_quote`,
        data,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Porter Get Quote Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get quote from Porter');
    }
  }

  // Step 2: Create Order
  async createOrder(data: PorterOrderRequest) {
    try {
      const response = await axios.post(
        `${this.baseURL}/v1/orders/create`,
        data,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Porter Create Order Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create order');
    }
  }

  // Step 3: Track Order
  async trackOrder(orderId: string) {
    try {
      const response = await axios.get(
        `${this.baseURL}/v1/orders/${orderId}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Porter Track Order Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to track order');
    }
  }

  // Cancel Order
  async cancelOrder(orderId: string) {
    try {
      const response = await axios.post(
        `${this.baseURL}/v1/orders/cancel`,
        { order_id: orderId },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Porter Cancel Order Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to cancel order');
    }
  }

  // Get Order Details
  async getOrderDetails(orderId: string) {
    try {
      const response = await axios.get(
        `${this.baseURL}/v1/orders/${orderId}/details`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Porter Order Details Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get order details');
    }
  }

  // Helper: Generate unique request ID
  generateRequestId(): string {
    return `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const porterAPI = new PorterAPIService();
