import { toPage } from './page';

describe('toPage', () => {
  it('déballe la clé de la ressource dans items', () => {
    const raw = { products: [{ id: 1 }, { id: 2 }], total: 194, skip: 0, limit: 2 };
    expect(toPage<'products', { id: number }>('products')(raw)).toEqual({
      items: [{ id: 1 }, { id: 2 }],
      total: 194,
      skip: 0,
      limit: 2,
    });
  });
});
