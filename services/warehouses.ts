// ─── Types ───────────────────────────────────────────────
export type Warehouse = {
  id: string;
  code: string;
  name: string;
  created_at?: string;
};

// ─── Warehouse with hierarchy summary ────────────────────
export type WarehouseWithSummary = Warehouse & {
  floors_count: number;
  locations_count: number;
};

export interface CreateWarehouseDto {
  code: string;
  name: string;
}

export interface UpdateWarehouseDto {
  code: string;
  name: string;
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

// ═════════════════════════════════════════════════════════
//  CLIENT-SIDE SERVICE (calls API routes)
// ═════════════════════════════════════════════════════════

export const warehouseService = {
  async getAll(): Promise<Warehouse[]> {
    const response = await fetch('/api/warehouses');
    const result = await readJsonSafely(response);
    if (!response.ok) throw new Error(extractError(result, 'Failed to load warehouses'));
    return result.data ?? [];
  },

  async getAllWithSummary(): Promise<WarehouseWithSummary[]> {
    const response = await fetch('/api/warehouses/summary');
    const result = await readJsonSafely(response);
    if (!response.ok) throw new Error(extractError(result, 'Failed to load warehouses summary'));
    return result.data ?? [];
  },

  async getById(id: string): Promise<Warehouse> {
    const response = await fetch(`/api/warehouses/${id}`);
    const result = await readJsonSafely(response);
    if (!response.ok) throw new Error(extractError(result, 'Failed to load warehouse'));
    return result.data;
  },

  async create(dto: CreateWarehouseDto): Promise<Warehouse> {
    const response = await fetch('/api/warehouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const result = await readJsonSafely(response);
    if (!response.ok) throw new Error(extractError(result, 'Failed to create warehouse'));
    return result.data;
  },

  async update(id: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    const response = await fetch(`/api/warehouses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const result = await readJsonSafely(response);
    if (!response.ok) throw new Error(extractError(result, 'Failed to update warehouse'));
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/warehouses/${id}`, { method: 'DELETE' });
    const result = await readJsonSafely(response);
    if (!response.ok) throw new Error(extractError(result, 'Failed to delete warehouse'));
  },
};

// Backwards-compatible named exports (if any old files still import these)
export async function listWarehouses() {
  return warehouseService.getAll();
}
export async function listWarehousesWithSummary() {
  return warehouseService.getAllWithSummary();
}
export async function getWarehouseById(id: string) {
  return warehouseService.getById(id);
}
export async function createWarehouse(dto: CreateWarehouseDto) {
  return warehouseService.create(dto);
}
export async function updateWarehouse(id: string, dto: UpdateWarehouseDto) {
  return warehouseService.update(id, dto);
}
export async function deleteWarehouse(id: string) {
  return warehouseService.delete(id);
}
