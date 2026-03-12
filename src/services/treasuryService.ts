import { supabase, isSupabaseConfigured } from './supabase';
import type {
  OfficialReceiptFormData,
  OfficialReceiptWithDetails,
  OfficialReceiptCancellation,
  CollectionType,
  PaymentMethod,
  ORSeries,
  TreasuryStats,
} from '../types/treasury.types';

// ============================================================================
// COLLECTION TYPES
// ============================================================================

export async function getCollectionTypes() {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .from('collection_type')
    .select('*')
    .eq('is_active', true)
    .order('description');

  if (error) throw error;
  return data as CollectionType[];
}

export async function getCollectionTypeById(id: string) {
  if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase not configured');

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .from('collection_type')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as CollectionType;
}

// ============================================================================
// PAYMENT METHODS
// ============================================================================

export async function getPaymentMethods() {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .from('payment_method')
    .select('*')
    .eq('is_active', true)
    .order('description');

  if (error) throw error;
  return data as PaymentMethod[];
}

export async function getPaymentMethodById(id: string) {
  if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase not configured');

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .from('payment_method')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as PaymentMethod[];
}

// ============================================================================
// OR SERIES
// ============================================================================

export async function getORSeries() {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .from('or_series')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ORSeries[];
}

export async function getActiveORSeries() {
  if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase not configured');

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .from('or_series')
    .select('*')
    .eq('is_active', true)
    .lt('current_number', (supabase as NonNullable<typeof supabase>).rpc('end_number'))
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data as ORSeries;
}

export async function getORSeriesById(id: string) {
  if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase not configured');

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .from('or_series')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ORSeries;
}

// ============================================================================
// OFFICIAL RECEIPTS
// ============================================================================

export async function getOfficialReceipts(filters?: {
  status?: string;
  fiscal_year?: number;
  fiscal_month?: number;
  collection_type_id?: string;
  from_date?: string;
  to_date?: string;
}) {
  if (!isSupabaseConfigured() || !supabase) return [];

  let query = (supabase as NonNullable<typeof supabase>)
    .from('official_receipt')
    .select(`
      *,
      collection_type:collection_type_id(*),
      payment_method:payment_method_id(*),
      or_series:or_series_id(*)
    `)
    .order('or_date', { ascending: false })
    .order('or_number', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.fiscal_year) {
    query = query.eq('fiscal_year', filters.fiscal_year);
  }

  if (filters?.fiscal_month) {
    query = query.eq('fiscal_month', filters.fiscal_month);
  }

  if (filters?.collection_type_id) {
    query = query.eq('collection_type_id', filters.collection_type_id);
  }

  if (filters?.from_date) {
    query = query.gte('or_date', filters.from_date);
  }

  if (filters?.to_date) {
    query = query.lte('or_date', filters.to_date);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as OfficialReceiptWithDetails[];
}

export async function getOfficialReceiptById(id: string) {
  if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase not configured');

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .from('official_receipt')
    .select(`
      *,
      collection_type:collection_type_id(*),
      payment_method:payment_method_id(*),
      or_series:or_series_id(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as OfficialReceiptWithDetails;
}

export async function getOfficialReceiptByNumber(orNumber: string) {
  if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase not configured');

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .from('official_receipt')
    .select(`
      *,
      collection_type:collection_type_id(*),
      payment_method:payment_method_id(*),
      or_series:or_series_id(*)
    `)
    .eq('or_number', orNumber)
    .single();

  if (error) throw error;
  return data as OfficialReceiptWithDetails;
}

export async function createOfficialReceipt(formData: OfficialReceiptFormData) {
  if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase not configured');

  const { data: userData, error: userError } = await (supabase as NonNullable<typeof supabase>).auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('User not authenticated');

  const receiptData = {
    ...formData,
    prepared_by: userData.user.id,
    status: 'active',
  };

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .from('official_receipt')
    .insert(receiptData)
    .select(`
      *,
      collection_type:collection_type_id(*),
      payment_method:payment_method_id(*),
      or_series:or_series_id(*)
    `)
    .single();

  if (error) throw error;
  return data as OfficialReceiptWithDetails;
}

export async function updateOfficialReceipt(id: string, formData: Partial<OfficialReceiptFormData>) {
  if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase not configured');

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .from('official_receipt')
    .update(formData)
    .eq('id', id)
    .select(`
      *,
      collection_type:collection_type_id(*),
      payment_method:payment_method_id(*),
      or_series:or_series_id(*)
    `)
    .single();

  if (error) throw error;
  return data as OfficialReceiptWithDetails;
}

export async function cancelOfficialReceipt(id: string, cancellationData: OfficialReceiptCancellation) {
  if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase not configured');

  const { data: userData, error: userError } = await (supabase as NonNullable<typeof supabase>).auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('User not authenticated');

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .from('official_receipt')
    .update({
      status: 'cancelled',
      cancellation_reason: cancellationData.cancellation_reason,
      cancelled_by: userData.user.id,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      collection_type:collection_type_id(*),
      payment_method:payment_method_id(*),
      or_series:or_series_id(*)
    `)
    .single();

  if (error) throw error;
  return data as OfficialReceiptWithDetails;
}

export async function voidOfficialReceipt(id: string, reason: string) {
  if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase not configured');

  const { data: userData, error: userError } = await (supabase as NonNullable<typeof supabase>).auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('User not authenticated');

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .from('official_receipt')
    .update({
      status: 'void',
      cancellation_reason: reason,
      cancelled_by: userData.user.id,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      collection_type:collection_type_id(*),
      payment_method:payment_method_id(*),
      or_series:or_series_id(*)
    `)
    .single();

  if (error) throw error;
  return data as OfficialReceiptWithDetails;
}

// ============================================================================
// STATISTICS
// ============================================================================

export async function getTreasuryStats(fiscalYear?: number): Promise<TreasuryStats> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      total_receipts_today: 0,
      total_amount_today: 0,
      total_receipts_month: 0,
      total_amount_month: 0,
      total_receipts_year: 0,
      total_amount_year: 0,
    };
  }

  const year = fiscalYear || new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth() + 1;

  // Today's receipts
  const { data: todayData, error: todayError } = await (supabase as NonNullable<typeof supabase>)
    .from('official_receipt')
    .select('amount')
    .eq('status', 'active')
    .eq('or_date', today);

  if (todayError) throw todayError;

  const total_receipts_today = todayData?.length || 0;
  const total_amount_today = todayData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

  // This month's receipts
  const { data: monthData, error: monthError } = await (supabase as NonNullable<typeof supabase>)
    .from('official_receipt')
    .select('amount')
    .eq('status', 'active')
    .eq('fiscal_year', year)
    .eq('fiscal_month', currentMonth);

  if (monthError) throw monthError;

  const total_receipts_month = monthData?.length || 0;
  const total_amount_month = monthData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

  // This year's receipts
  const { data: yearData, error: yearError } = await (supabase as NonNullable<typeof supabase>)
    .from('official_receipt')
    .select('amount')
    .eq('status', 'active')
    .eq('fiscal_year', year);

  if (yearError) throw yearError;

  const total_receipts_year = yearData?.length || 0;
  const total_amount_year = yearData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

  return {
    total_receipts_today,
    total_amount_today,
    total_receipts_month,
    total_amount_month,
    total_receipts_year,
    total_amount_year,
  };
}

// ============================================================================
// REPORTS
// ============================================================================

export async function getCollectionReport(filters: {
  from_date: string;
  to_date: string;
  collection_type_id?: string;
}) {
  if (!isSupabaseConfigured() || !supabase) return [];

  let query = (supabase as NonNullable<typeof supabase>)
    .from('official_receipt')
    .select(`
      *,
      collection_type:collection_type_id(*),
      payment_method:payment_method_id(*)
    `)
    .eq('status', 'active')
    .gte('or_date', filters.from_date)
    .lte('or_date', filters.to_date)
    .order('or_date')
    .order('or_number');

  if (filters.collection_type_id) {
    query = query.eq('collection_type_id', filters.collection_type_id);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as OfficialReceiptWithDetails[];
}

export async function getCollectionSummaryByType(fiscalYear: number, fiscalMonth?: number) {
  if (!isSupabaseConfigured() || !supabase) return [];

  let query = (supabase as NonNullable<typeof supabase>)
    .from('official_receipt')
    .select(`
      collection_type_id,
      amount,
      collection_type:collection_type_id(description)
    `)
    .eq('status', 'active')
    .eq('fiscal_year', fiscalYear);

  if (fiscalMonth) {
    query = query.eq('fiscal_month', fiscalMonth);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Group by collection type
  const summary = data?.reduce((acc: any, item: any) => {
    const typeId = item.collection_type_id;
    const typeName = item.collection_type?.description || 'Unknown';
    
    if (!acc[typeId]) {
      acc[typeId] = {
        collection_type_id: typeId,
        collection_type: typeName,
        total_amount: 0,
        count: 0,
      };
    }
    
    acc[typeId].total_amount += Number(item.amount);
    acc[typeId].count += 1;
    
    return acc;
  }, {});

  return Object.values(summary || {});
}
