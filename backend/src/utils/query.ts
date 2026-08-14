import { Request } from 'express';

export const queryString = (req: Request, key: string): string | undefined => {
  const value = req.query[key];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  if (value && typeof value === 'object') {
    const v = (value as Record<string, unknown>).value;
    if (typeof v === 'string') return v;
  }
  return undefined;
};

export const queryNumber = (req: Request, key: string): number | undefined => {
  const value = queryString(req, key);
  return value ? parseInt(value, 10) : undefined;
};