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
  // mtypes = "ชนิด" picker (mtype table — Fsearch.pas with table='mtype')
  mtypes:              (company, q = '')                              => call('mtypes',                { company, q }),
  // brands = "ประเภท" picker — filtered by typeid if provided
  brands:              (company, typeid, q = '')                      => call('brands',                { company, typeid, q }),
  materials:           (company, mtype)                               => call('materials',             { company, mtype }),
  // LV1: Delphi stockcard query — filter by mtype.typeid and optional brand.id, or by custom mids list
  stockcard:           (company, branch, mtype, brand, from, to, mids)      => call('stockcard',             { company, branch, mtype, brand, from, to, mids }),
  // LV2: movements grouped by Abill (SUBSTRING(billno,1,2))
  movements:           (company, branch, branchcode, mid, brand, from, to) => call('movements',       { company, branch, branchcode, mid, brand, from, to }),
  // LV7: FIFO lot grid — pass branchcode for POS.material_{branchcode}
  lots:                (company, branch, mid, branchcode)             => call('lots',                  { company, branch, mid, branchcode }),
  // TabChanid summary views
  stockcardByType:     (company, branch, branchcode, from, to)        => call('stockcard_bytype',      { company, branch, branchcode, from, to }),
  stockcardByBrand:    (company, branch, branchcode, from, to)        => call('stockcard_bybrand',     { company, branch, branchcode, from, to }),
  stockcardByMidType:  (company, branch, branchcode, mtype, from, to) => call('stockcard_bymid_type',  { company, branch, branchcode, mtype, from, to }),
  stockcardByMidBrand: (company, branch, brand, from, to)             => call('stockcard_bymid_brand', { company, branch, brand, from, to }),
};