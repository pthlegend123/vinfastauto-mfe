export interface ProductImage {
  id: number;
  sku: string;
  imageUrl: string;
  isThumbnail: boolean;
  displayOrder: number;
}

export interface MasterColor {
  colorCode: string;
  colorName: string;
  colorHex: string;
  colorHex2?: string;
}

export interface ProductSku {
  sku: string;
  stockQuantity: number;
  color?: MasterColor;
  images?: ProductImage[];
}

export interface ProductVariant {
  id: number;
  variantCode: string;
  productCode: string;
  variantName: string;
  batteryCapacity: string;
  rangePerCharge: number;
  price: number;
  batterySubscriptionPrice?: number;
  skus: ProductSku[];
}

export interface CarSpec {
  id: number;
  productCode: string;
  seatingCapacity: number;
  drivetrain: string;
  adasLevel: string;
  airbags: number;
}

export interface Product {
  id: number;
  productCode: string;
  name: string;
  type: string;
  description?: string;
  carSpec?: CarSpec;
  motorcycleSpec?: Record<string, unknown>;
  variants: ProductVariant[];
}

export interface PagedResponse<T> {
  content: T[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  errorCode?: string;
}
