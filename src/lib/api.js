/**
 * API client — calls the stockApi backend function.
 * Falls back to mock data on error.
 */
import { base44 } from '@/api/base44Client';

async function call(action, params) {
  const res = await base44.functions.invoke('stockApi', { action, ...params });
  return res.data;
}

export const api = {
  schema:     (company)                       => call('schema',     { company }),
  branches:   (company)                       => call('branches',   { company }),
  mtypes:     (company, q = '')              => call('mtypes',     { company, q }),
  msubtypes:  (company, q = '')              => call('msubtypes',  { company, q }),
  materials:  (company, mtype, brand)         => call('materials',  { company, mtype, brand }),
  stockcard:  (company, branch, mtype, brand, from, to) =>
                                               call('stockcard',   { company, branch, mtype, brand, from, to }),
  movements:  (company, branch, mid, from, to) => call('movements', { company, branch, mid, from, to }),
  lots:       (company, branch, mid)           => call('lots',      { company, branch, mid }),
};