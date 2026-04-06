import { apiClient } from './apiClient';
import type { ApiResponse, PagedResponse, Product } from '../types/product.types';

export const productService = {
  getAllProducts: async () => {
    return apiClient.get<ApiResponse<PagedResponse<Product>>>('/products/get-all');
  },
  getProductByCode: async (code: string) => {
    return apiClient.get<ApiResponse<Product>>(`/products/${code}`);
  }
};
