import type { Product } from '../types/product.types';

export const sharedDataService = {
  products: [] as Product[],
  hasFetchedProducts: false,

  setProducts(data: Product[]) {
    this.products = data;
    this.hasFetchedProducts = true;
  },

  getProducts() {
    return this.products;
  },

  getProductByCode(code: string) {
    return this.products.find(p => p.productCode === code);
  },

  updateProduct(code: string, updatedData: Partial<Product>) {
    const index = this.products.findIndex(p => p.productCode === code);
    if (index !== -1) {
      this.products[index] = { ...this.products[index], ...updatedData };
      return true;
    }
    return false;
  },

  addProduct(product: Product) {
    const exists = this.products.some(p => p.productCode === product.productCode);
    if (!exists) {
      this.products.push(product);
      return true;
    }
    return false;
  },

  removeProduct(code: string) {
    const initialLength = this.products.length;
    this.products = this.products.filter(p => p.productCode !== code);
    return this.products.length !== initialLength;
  },

  clearData() {
    this.products = [];
    this.hasFetchedProducts = false;
  }
};
