import { useState, useEffect } from 'react';
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchCategories() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/categories`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories.');
    } finally {
      setIsLoading(false);
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
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCategories([...categories, data]);
      return data;
    } catch (err) {
      console.error('Error creating category:', err);
      // Optionally set an error state here if needed for create operations
      return null; // Indicate failure
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  return { categories, createCategory, isLoading, error };
}
