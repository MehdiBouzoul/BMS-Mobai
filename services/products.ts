// Client-safe products service (NO supabase server client import)

export interface Product {
  id: string;
  name: string;
  sku: string;
  weight?: number | null;
  description?: string | null;
  created_at?: string;
}

export interface CreateProductDto {
  name: string;
  sku: string;
  weight?: number | null;
  description?: string | null;
}

export interface UpdateProductDto {
  name?: string;
  sku?: string;
  weight?: number | null;
  description?: string | null;
}

async function readJsonSafely(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text || response.statusText };
  }
}

function extractError(result: any, fallback: string) {
  return result?.error || result?.message || result?.details || fallback;
}

export const productService = {
  async getAll(): Promise<Product[]> {
    const response = await fetch('/api/products');
    const result = await readJsonSafely(response);
    // if (!response.ok) throw new Error(extractError(result, 'Failed to load products'));
    return result.data ?? [];
  },

  async create(dto: CreateProductDto): Promise<Product> {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const result = await readJsonSafely(response);
    if (!response.ok) throw new Error(extractError(result, 'Failed to create product'));
    return result.data;
  },

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const result = await readJsonSafely(response);
    if (!response.ok) throw new Error(extractError(result, 'Failed to update product'));
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    const result = await readJsonSafely(response);
    if (!response.ok) throw new Error(extractError(result, 'Failed to delete product'));
  },
};

// Backwards-compatible named exports (in case UI imports these directly)
export async function listProducts() {
  return productService.getAll();
}

export async function getProducts() {
  return productService.getAll();
}
export async function createProduct(dto: CreateProductDto) {
  return productService.create(dto);
}
export async function updateProduct(id: string, dto: UpdateProductDto) {
  return productService.update(id, dto);
}
export async function deleteProduct(id: string) {
  return productService.delete(id);
}
