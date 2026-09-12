import { supabase } from './supabaseClient';
import { api } from './api';

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
  const { data: result, error } = await supabase.from('contracts').insert([data]).select().single();
  if (error) throw error;
  return result;
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

/** Fetch contracts owned by or connected to one company. */
export async function fetchCompanyContracts(companyId: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .or(`owner_company_id.eq.${companyId},seller_id.eq.${companyId},buyer_id.eq.${companyId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/** Update contract status or signature fields in Supabase. */
export async function updateContract(id: string | number, updates: Record<string, any>) {
  const { data, error } = await supabase.from('contracts').update(updates).eq('id', id);
  if (error) throw error;
  return data;
}

/**
 * Insert a new order record into Supabase table 'orders'.
 */
export async function addOrder(data: Record<string, any>) {
  try {
    const { data: result, error } = await supabase.from('orders').insert([data]);
    if (error) {
      console.warn('Supabase DB orders insert notice:', error.message);
    }
    return result;
  } catch (err: any) {
    console.warn('Supabase DB orders insert skipped:', err.message);
    return null;
  }
}

/**
 * Fetch orders from Supabase table 'orders'.
 */
export async function fetchOrders(filters: Record<string, any> = {}) {
  try {
    let query = supabase.from('orders').select('*');
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'All') {
        query = query.eq(key, value);
      }
    });
    const { data, error } = await query;
    if (error) {
      console.warn('Supabase DB orders fetch notice:', error.message);
      return [];
    }
    return data || [];
  } catch (err: any) {
    console.warn('Supabase DB orders fetch skipped:', err.message);
    return [];
  }
}

/**
 * Delete all orders from Supabase table 'orders'.
 */
export async function clearSupabaseOrders() {
  try {
    const { data } = await supabase.from('orders').select('id');
    if (data && data.length > 0) {
      const ids = data.map((r: any) => r.id);
      const { error } = await supabase.from('orders').delete().in('id', ids);
      if (error) {
        console.warn('Supabase DB delete orders notice:', error.message);
      }
    }
  } catch (err: any) {
    console.warn('Supabase DB delete orders skipped:', err.message);
  }
}

/**
 * Update an order record in Supabase table 'orders'.
 */
export async function updateSupabaseOrder(id: string | number, updates: Record<string, any>) {
  try {
    const { data, error } = await supabase.from('orders').update(updates).eq('id', id);
    if (error) {
      console.warn('Supabase DB order update notice:', error.message);
    }
    return data;
  } catch (err: any) {
    console.warn('Supabase DB order update skipped:', err.message);
    return null;
  }
}

/**
 * Get global clear timestamp for orders from Supabase DB or local storage fallback.
 */
export async function getGlobalClearTimestamp(): Promise<number> {
  try {
    const { data } = await supabase.from('system_state').select('value').eq('key', 'orders_cleared_at').single();
    if (data && data.value && data.value.timestamp) {
      const ts = Number(data.value.timestamp);
      // Keep local storage in sync as fallback
      localStorage.setItem('loopmarket_cleared_at', String(ts));
      return ts;
    }
  } catch {
    // ignore Supabase error
  }
  const localTs = localStorage.getItem('loopmarket_cleared_at');
  return localTs ? Number(localTs) : 0;
}

/**
 * Record global clear timestamp in Supabase DB and local storage.
 */
export async function setGlobalClearTimestamp(): Promise<number> {
  const ts = Date.now();
  localStorage.setItem('loopmarket_cleared_at', String(ts));
  localStorage.setItem('loopmarket_cleared', 'true');
  try {
    await supabase.from('system_state').upsert([
      { key: 'orders_cleared_at', value: { timestamp: ts }, updated_at: new Date().toISOString() }
    ], { onConflict: 'key' });
  } catch (err: any) {
    console.warn('Supabase DB setGlobalClearTimestamp skipped:', err.message);
  }
  return ts;
}

/**
 * Clear all cached local data and broadcast global order wipe to all teammates.
 */
export async function clearAllLocalData() {
  try {
    localStorage.removeItem('loopmarket_user_orders');
    localStorage.removeItem('loopmarket_user_listings');
    localStorage.removeItem('loopmarket_user_requirements');
    localStorage.removeItem('loopmarket_user_contracts');
    await setGlobalClearTimestamp().catch(() => null);
    await clearSupabaseOrders().catch(() => null);
    await api.clearOrders().catch(() => null);
  } catch {
    // ignore
  }
}


