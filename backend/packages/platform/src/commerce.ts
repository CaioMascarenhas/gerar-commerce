import { BadRequestException, HttpException, ServiceUnavailableException } from '@nestjs/common';

export const serviceUrls = {
  stores: process.env['STORES_URL'] ?? 'http://127.0.0.1:3006',
  catalog: process.env['CATALOG_URL'] ?? 'http://127.0.0.1:3001',
  inventory: process.env['INVENTORY_URL'] ?? 'http://127.0.0.1:3002',
  orders: process.env['ORDERS_URL'] ?? 'http://127.0.0.1:3003',
  ai: process.env['AI_ASSISTANT_URL'] ?? 'http://127.0.0.1:3005',
};
export async function callService<T = any>(
  service: keyof typeof serviceUrls,
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(serviceUrls[service] + '/api' + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-service-key': process.env['INTERNAL_API_KEY'] ?? 'gerar-local-internal',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(service === 'ai' ? 60000 : 15000),
    });
  } catch {
    throw new ServiceUnavailableException(
      'O serviço ' + service + ' está indisponível. Tente novamente.',
    );
  }
  const data = await response.json();
  if (!response.ok) throw new HttpException(data, response.status);
  return data as T;
}
export function text(value: unknown, field: string, max = 200, min = 1): string {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max)
    throw new BadRequestException(field + ': informe entre ' + min + ' e ' + max + ' caracteres.');
  return value.trim();
}
export function integer(value: unknown, field: string, min = 0, max = 100000000): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max)
    throw new BadRequestException(field + ': valor inválido.');
  return value;
}
export function image(value: unknown, required = false): string {
  if (value === '' || value === undefined || value === null) {
    if (required) throw new BadRequestException('Adicione uma foto de capa para a loja.');
    return '';
  }
  if (
    typeof value !== 'string' ||
    value.length > 2900000 ||
    !(
      /^(data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+)$/.test(value) ||
      /^https:\/\/[^\s]+$/.test(value)
    )
  )
    throw new BadRequestException('Use uma imagem PNG, JPG ou WebP de até 2 MB, ou uma URL HTTPS.');
  return value;
}
export function productInput(body: any) {
  if (!body || typeof body !== 'object') throw new BadRequestException('Produto inválido.');
  return {
    name: text(body.name, 'Nome do produto', 100),
    description: text(body.description, 'Descrição', 600),
    priceInCents: integer(body.priceInCents, 'Preço', 1),
    stock: integer(body.stock, 'Estoque', 0, 1000000),
    image: image(body.image),
    imageFrame: imageFrame(body.imageFrame),
    imageSource: body.imageSource === 'illustrative' ? 'illustrative' : 'owner',
  };
}
export function imageFrame(value: any) {
  if (value === undefined || value === null) return { fit: 'contain', x: 50, y: 50, zoom: 1 };
  if (
    !['contain', 'cover'].includes(value.fit) ||
    ![value.x, value.y, value.zoom].every(Number.isFinite) ||
    value.x < 0 ||
    value.x > 100 ||
    value.y < 0 ||
    value.y > 100 ||
    value.zoom < 1 ||
    value.zoom > 3
  )
    throw new BadRequestException('Enquadramento da imagem inválido.');
  return { fit: value.fit, x: value.x, y: value.y, zoom: value.zoom };
}
export function slugInput(value: unknown) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]{1,49}$/.test(value))
    throw new BadRequestException(
      'Endereço da loja inválido. Use de 2 a 50 letras, números ou hífens, começando por uma letra.',
    );
  return value;
}
