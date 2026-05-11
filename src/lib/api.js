/**
 * API client — calls the stockApi backend function.
 */
import { base44 } from '@/api/base44Client';

async function call(action, params) {
  const res = await base44.functions.invoke('stockApi', { action, ...params });
  return res.data;
}

export const api = {
  schema:              (company)                            => call('schema',                { company }),
  branches:            (company)                            => call('branches',              { company }),
  mtypes:              (company, q = '')                   => call('mtypes',                { company, q }),
  // 'brand' table = ชนิดย่อย (msubtype). msubtypes alias kept for compat.
  brands:              (company, q = '', mtype)             => call('brands',               { company, q, mtype }),
  msubtypes:           (company, q = '')                   => call('msubtypes',             { company, q }),
  materials:           (company, mtype, brand)              => call('materials',             { company, mtype, brand }),
  stockcard:           (company, branch, mtype, brand, from, to) =>
                                                             call('stockcard',              { company, branch, mtype, brand, from, to }),
  // Summary views for TabChanid (by mtype) and TabChanidYoi (by brand)
  stockcardByType:     (company, branch, from, to)          => call('stockcard_bytype',     { company, branch, from, to }),
  stockcardByBrand:    (company, branch, from, to)          => call('stockcard_bybrand',    { company, branch, from, to }),
  stockcardByMidType:  (company, branch, mtype, from, to)   => call('stockcard_bymid_type', { company, branch, mtype, from, to }),
  stockcardByMidBrand: (company, branch, brand, from, to)   => call('stockcard_bymid_brand',{ company, branch, brand, from, to }),
  movements:           (company, branch, mid, from, to)     => call('movements',            { company, branch, mid, from, to }),
  lots:                (company, branch, mid)                => call('lots',                 { company, branch, mid }),
};