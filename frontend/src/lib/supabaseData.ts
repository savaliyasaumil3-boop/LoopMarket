import { supabase } from './supabaseClient';

/**
 * Insert a new material record into Supabase.
 * `data` should match the columns of your `materials` table.
 */
export async function addMaterial(data: Record<string, any>) {
  const { data: result, error } = await supabase.from('materials').insert([data]);
  if (error) throw error;
  return result;
}

/**
 * Fetch materials with optional query filters.
 * `filters` is an object where keys are column names and values are the filter values.
 */
export async function fetchMaterials(filters: Record<string, any> = {}) {
  let query = supabase.from('materials').select('*');
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Insert a new requirement record into Supabase.
 */
export async function addRequirement(data: Record<string, any>) {
  const { data: result, error } = await supabase.from('requirements').insert([data]);
  if (error) throw error;
  return result;
}

/**
 * Fetch requirements with optional filters.
 */
export async function fetchRequirements(filters: Record<string, any> = {}) {
  let query = supabase.from('requirements').select('*');
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
