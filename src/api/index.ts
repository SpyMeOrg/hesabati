const API_URL = 'http://localhost:3000/api';

// التصنيفات
export const getCategories = async () => {
  const response = await fetch(`${API_URL}/categories`);
  if (!response.ok) throw new Error('فشل جلب التصنيفات');
  return response.json();
};

export const addCategory = async (category: any) => {
  const response = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(category),
  });
  if (!response.ok) throw new Error('فشل إضافة التصنيف');
  return response.json();
};

// الوحدات
export const getUnits = async () => {
  const response = await fetch(`${API_URL}/units`);
  if (!response.ok) throw new Error('فشل جلب الوحدات');
  return response.json();
};

export const addUnit = async (unit: any) => {
  const response = await fetch(`${API_URL}/units`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(unit),
  });
  if (!response.ok) throw new Error('فشل إضافة الوحدة');
  return response.json();
};

// المنتجات
export const getProducts = async () => {
  const response = await fetch(`${API_URL}/products`);
  if (!response.ok) throw new Error('فشل جلب المنتجات');
  return response.json();
};

export const addProduct = async (product: any) => {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(product),
  });
  if (!response.ok) throw new Error('فشل إضافة المنتج');
  return response.json();
};

// حركات المخزون
export const getMovements = async () => {
  const response = await fetch(`${API_URL}/movements`);
  if (!response.ok) throw new Error('فشل جلب حركات المخزون');
  return response.json();
};

export const addMovement = async (movement: any) => {
  const response = await fetch(`${API_URL}/movements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(movement),
  });
  if (!response.ok) throw new Error('فشل إضافة حركة المخزون');
  return response.json();
}; 