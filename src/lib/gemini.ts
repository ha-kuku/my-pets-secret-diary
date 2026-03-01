import type { GenerateResponse } from '../types';

const API_BASE = '/api';

export async function generateDiary(
  imageData: string,
  report: string
): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: imageData, report }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `API error: ${response.status}`);
  }

  return response.json() as Promise<GenerateResponse>;
}

export async function uploadPolaroid(
  polaroidBase64: string
): Promise<{ shareUrl: string }> {
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ polaroid: polaroidBase64 }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Upload error: ${response.status}`);
  }

  return response.json() as Promise<{ shareUrl: string }>;
}
