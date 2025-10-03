import { useState, useEffect } from 'react';
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export function useCategories() {
  const [categories, setCategories] = useState([]);

  async function fetchCategories() {
    try {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.log('Error fetching categories', error);
    }
  }

  async function createCategory(name, icon) {
    try {
      const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, icon }),
      });
      const data = await response.json();
      setCategories([...categories, data]);
      return data;
    } catch (error) {
      console.log('Error creating category', error);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  return { categories, createCategory };
}
