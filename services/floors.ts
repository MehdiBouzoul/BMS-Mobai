export interface Floor {
  id: string;
  warehouse_id: string;
  level: number;
  created_at?: string;
}

export interface CreateFloorDto {
  warehouse_id: string;
  level: number;
}

export interface UpdateFloorDto {
  level: number;
}

export const floorService = {
  async getAll(warehouseId?: string): Promise<Floor[]> {
    const url = warehouseId 
      ? `/api/floors?warehouse_id=${warehouseId}`
      : '/api/floors';
    const response = await fetch(url);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result.data;
  },

  async create(dto: CreateFloorDto): Promise<Floor> {
    const response = await fetch('/api/floors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result.data;
  },

  async update(id: string, dto: UpdateFloorDto): Promise<Floor> {
    const response = await fetch(`/api/floors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/floors/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error);
    }
  },
};
