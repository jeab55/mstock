/**
 * API client — calls the stockApi backend function.
 */
import { base44 } from '@/api/base44Client';

async function call(action, params) {
  const res = await base44.functions.invoke('stockApi', { action, ...params });
  return res.data;
}

export const api = {
  schema:              (company)                                      => call('schema',                { company }),
  // branches: returns flat list with _group markers for section headers
  branches:            (company, opts = {})                           => call('branches',              { company, ...opts }),
  // brands = "ชนิด" picker (brand table, not mtype)
  brands:              (company, q = '')                              => call('brands',               { company, q }),
  materials:           (company, brand)                               => call('materials',             { company, brand }),
  // LV1: Delphi stockcard query — requires brand (not mtype)
  stockcard:           (company, branch, brand, from, to)             => call('stockcard',             { company, branch, brand, from, to }),
  // LV2: movements grouped by Abill (SUBSTRING(billno,1,2))
  movements:           (company, branch, mid, from, to)               => call('movements',             { company, branch, mid, from, to }),
  // LV7: FIFO lot grid — pass branchcode for POS.material_{branchcode}
  lots:                (company, branch, mid, branchcode)             => call('lots',                  { company, branch, mid, branchcode }),
  // TabChanid summary views
  stockcardByType:     (company, branch, from, to)                    => call('stockcard_bytype',      { company, branch, from, to }),
  stockcardByBrand:    (company, branch, from, to)                    => call('stockcard_bybrand',     { company, branch, from, to }),
  stockcardByMidType:  (company, branch, mtype, from, to)             => call('stockcard_bymid_type',  { company, branch, mtype, from, to }),
  stockcardByMidBrand: (company, branch, brand, from, to)             => call('stockcard_bymid_brand', { company, branch, brand, from, to }),
};