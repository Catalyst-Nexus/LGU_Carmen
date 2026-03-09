import { supabase, isSupabaseConfigured } from './supabase';
import type {
  GeneralAccountingPlan,
  GeneralAccountingPlanSub,
  GeneralAccountingPlanFormData,
  GeneralAccountingPlanSubFormData,
  GeneralAccountingPlanRequest,
  GeneralAccountingPlanRequestFormData,
} from '@/types/accounting.types';

const getClient = () => {
  if (!isSupabaseConfigured() || !supabase) return null;
  return (supabase as NonNullable<typeof supabase>).schema('accounting');
};

// ─── General Accounting Plan ─────────────────────────────────────────────────

export const fetchPlans = async (): Promise<GeneralAccountingPlan[]> => {
  const client = getClient();
  if (!client) return [];
  const { data, error } = await client
    .from('general_accounting_plan')
    .select('*')
    .order('description', { ascending: true });
  if (error) { console.error('fetchPlans:', error); return []; }
  return (data ?? []) as GeneralAccountingPlan[];
};

export const createPlan = async (
  payload: GeneralAccountingPlanFormData,
): Promise<GeneralAccountingPlan | null> => {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client
    .from('general_accounting_plan')
    .insert([payload])
    .select()
    .single();
  if (error) { console.error('createPlan:', error); return null; }
  return data as GeneralAccountingPlan;
};

export const updatePlan = async (
  id: string,
  payload: Partial<GeneralAccountingPlanFormData>,
): Promise<GeneralAccountingPlan | null> => {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client
    .from('general_accounting_plan')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) { console.error('updatePlan:', error); return null; }
  return data as GeneralAccountingPlan;
};

export const deletePlan = async (id: string): Promise<boolean> => {
  const client = getClient();
  if (!client) return false;
  const { error } = await client
    .from('general_accounting_plan')
    .delete()
    .eq('id', id);
  if (error) { console.error('deletePlan:', error); return false; }
  return true;
};

// ─── General Accounting Plan Sub ─────────────────────────────────────────────

export const fetchPlanSubs = async (): Promise<GeneralAccountingPlanSub[]> => {
  const client = getClient();
  if (!client) return [];
  const { data, error } = await client
    .from('general_accounting_plan_sub')
    .select('*, plan:general_accounting_plan_id(id, description, accounty_type)')
    .order('description', { ascending: true });
  if (error) { console.error('fetchPlanSubs:', error); return []; }
  return (data ?? []) as GeneralAccountingPlanSub[];
};

export const createPlanSub = async (
  payload: GeneralAccountingPlanSubFormData,
): Promise<GeneralAccountingPlanSub | null> => {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client
    .from('general_accounting_plan_sub')
    .insert([payload])
    .select('*, plan:general_accounting_plan_id(id, description, accounty_type)')
    .single();
  if (error) { console.error('createPlanSub:', error); return null; }
  return data as GeneralAccountingPlanSub;
};

export const updatePlanSub = async (
  id: string,
  payload: Partial<GeneralAccountingPlanSubFormData>,
): Promise<GeneralAccountingPlanSub | null> => {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client
    .from('general_accounting_plan_sub')
    .update(payload)
    .eq('id', id)
    .select('*, plan:general_accounting_plan_id(id, description, accounty_type)')
    .single();
  if (error) { console.error('updatePlanSub:', error); return null; }
  return data as GeneralAccountingPlanSub;
};

export const deletePlanSub = async (id: string): Promise<boolean> => {
  const client = getClient();
  if (!client) return false;
  const { error } = await client
    .from('general_accounting_plan_sub')
    .delete()
    .eq('id', id);
  if (error) { console.error('deletePlanSub:', error); return false; }
  return true;
};

// ─── General Accounting Plan Request ─────────────────────────────────────────

export const createPlanRequest = async (
  payload: GeneralAccountingPlanRequestFormData,
): Promise<GeneralAccountingPlanRequest | null> => {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client
    .from('general_accounting_plan_request')
    .insert([payload])
    .select()
    .single();
  if (error) { console.error('createPlanRequest:', error); return null; }
  return data as GeneralAccountingPlanRequest;
};
