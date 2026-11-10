// Fotos ilustrativas de um conjunto conhecido; o modelo não inventa URLs.
const photos: Record<string, { match: RegExp; id: string }[]> = {
  eletronicos: [
    { match: /fone|headphone/i, id: '1505740420928-5e560c06d30e' },
    { match: /teclado/i, id: '1587829741301-dc798b83add3' },
    { match: /som|speaker/i, id: '1608043152269-423dbba4e7e1' },
  ],
  construcao: [
    { match: /kit|ferramenta/i, id: '1530124566582-a618bc2615dc' },
    { match: /furadeira/i, id: '1504148455328-c376907d081c' },
    { match: /trena/i, id: '1586864387967-d02ef85d93e8' },
  ],
  roupas: [
    { match: /camiseta|blusa/i, id: '1521572163474-6864f9cf17ab' },
    { match: /calça|jeans/i, id: '1542272604-787c3835535d' },
    { match: /jaqueta|casaco/i, id: '1551028719-00167b16eac5' },
  ],
};
export function withIllustration(product: any, category: string, index: number) {
  const list = photos[category];
  const photo = list.find((entry) => entry.match.test(product.name)) ?? list[index % list.length];
  return {
    ...product,
    image: 'https://images.unsplash.com/photo-' + photo.id + '?auto=format&fit=crop&w=1000&q=80',
    imageSource: 'illustrative',
  };
}
