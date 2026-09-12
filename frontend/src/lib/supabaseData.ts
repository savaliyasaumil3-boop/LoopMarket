import { supabase } from './supabaseClient';

/**
 * Insert a new material record into Supabase.
 * `data` should match the columns of your `materials` table.
 */
export async function addMaterial(data: Record<string, any>) {
  try {
    const { data: result, error } = await supabase.from('materials').insert([data]);
    if (error) {
      console.warn('Supabase DB materials insert notice:', error.message);
    }
    return result;
  } catch (err: any) {
    console.warn('Supabase DB insert skipped or table missing:', err.message);
    return null;
  }
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
 * Delete a material record from Supabase table 'materials'.
 */
export async function deleteMaterial(id: string | number) {
  try {
    const { data, error } = await supabase.from('materials').delete().eq('id', id);
    if (error) {
      console.warn('Supabase DB delete notice:', error.message);
    }
    return { success: !error, data, error };
  } catch (err: any) {
    console.warn('Supabase DB delete skipped or error:', err.message);
    return { success: false, error: err.message };
  }
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

/**
 * Insert a new contract record into Supabase table 'contracts'.
 */
export async function addContract(data: Record<string, any>) {
  try {
    const { data: result, error } = await supabase.from('contracts').insert([data]);
    if (error) {
      console.warn('Supabase DB contracts insert notice:', error.message);
    }
    return result;
  } catch (err: any) {
    console.warn('Supabase DB contracts insert skipped:', err.message);
    return null;
  }
}

/**
 * Fetch contracts with optional query filters from Supabase.
 */
export async function fetchContracts(filters: Record<string, any> = {}) {
  try {
    let query = supabase.from('contracts').select('*');
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'All') {
        query = query.eq(key, value);
      }
    });
    const { data, error } = await query;
    if (error) {
      console.warn('Supabase DB contracts fetch notice:', error.message);
      return [];
    }
    return data || [];
  } catch (err: any) {
    console.warn('Supabase DB contracts fetch skipped:', err.message);
    return [];
  }
}

/**
 * Update contract status/signature in Supabase table 'contracts'.
 */
export async function updateContract(id: string | number, updates: Record<string, any>) {
  try {
    const { data, error } = await supabase.from('contracts').update(updates).eq('id', id);
    if (error) {
      console.warn('Supabase DB contract update notice:', error.message);
    }
    return data;
  } catch (err: any) {
    console.warn('Supabase DB contract update skipped:', err.message);
    return null;
  }
}
