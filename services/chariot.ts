export interface Chariot {
  id: string;
  chariot_number: string;
  status: 'available' | 'busy' | 'maintenance';
  created_at?: string;
}

export interface CreateChariotDto {
  [key: string]: any;
}

export interface UpdateChariotDto {
  [key: string]: any;
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
  return (
    result?.error ||
    result?.message ||
    result?.details ||
    fallback
  );
}

export const chariotService = {
  async getAll(): Promise<Chariot[]> {
    const response = await fetch('/api/chariots');
    const result = await readJsonSafely(response);
    // if (!response.ok) throw new Error(extractError(result, 'Failed to load chariots'));
    return result.data ?? [];
  },

  async create(dto: CreateChariotDto): Promise<Chariot> {
    const response = await fetch('/api/chariots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const result = await readJsonSafely(response);
    if (!response.ok) throw new Error(extractError(result, 'Failed to create chariot'));
    return result.data;
  },

  async update(id: string, dto: UpdateChariotDto): Promise<Chariot> {
    const response = await fetch(`/api/chariots/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const result = await readJsonSafely(response);
    if (!response.ok) throw new Error(extractError(result, 'Failed to update chariot'));
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/chariots/${id}`, { method: 'DELETE' });
    const result = await readJsonSafely(response);
    if (!response.ok) throw new Error(extractError(result, 'Failed to delete chariot'));
  },
};

// Compat exports used by existing UI code
export async function listChariots(): Promise<Chariot[]> {
  return chariotService.getAll();
}

export async function deleteChariot(id: string): Promise<void> {
  return chariotService.delete(id);
}

// Resilient helper used by the UI: returns a stable shape to the form
export async function createChariotResilient(chariotNumber: string): Promise<{
  success: boolean;
  data?: Chariot;
  error?: string;
  mode: 'db' | 'local';
}> {
  try {
    const data = await chariotService.create({
      chariot_number: chariotNumber.trim(),
      status: 'available',
    });

    return { success: true, data, mode: 'db' };
  } catch (e: any) {
    // simplest fallback: report failure; UI decides what to do
    return { success: false, error: e?.message ?? 'Failed to create chariot', mode: 'local' };
  }
}