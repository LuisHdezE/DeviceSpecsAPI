import { describe, expect, it, vi } from 'vitest';
import { GsmarenaProvider, ProviderResponseError, ProviderRateLimitedError, ProviderUnavailableError } from '../../src/infrastructure/providers/gsmarena/gsmarena-provider.js';

describe('GsmarenaProvider', () => {
 const client = () => ({ search: { search: vi.fn().mockResolvedValue([{ id:'apple_iphone_13-11103', name:'Apple iPhone 13' }]) },
   catalog: { getDevice: vi.fn().mockResolvedValue({ name:'Apple iPhone 13', detailSpec:[{ category:'Display', specifications:[{name:'Type',value:'Super Retina XDR'}]}] }) } });
 it('normalizes search results', async () => {
   const c = client(); const provider = new GsmarenaProvider(c);
   expect(await provider.search('  iphone 13  ')).toEqual([{ id:'apple_iphone_13-11103', name:'Apple iPhone 13',brand:'Apple' }]);
   expect(c.search.search).toHaveBeenCalledWith('iphone 13');
 });
 it('normalizes grouped device specifications', async () => {
   expect((await new GsmarenaProvider(client()).getById('apple_iphone_13-11103'))?.specifications).toEqual({ Display:{Type:'Super Retina XDR'} });
 });
 it('rejects invalid user-controlled identifiers without invoking upstream', async () => {
   const c=client(); await expect(new GsmarenaProvider(c).getById('https://evil.example')).rejects.toThrow(RangeError);
   expect(c.catalog.getDevice).not.toHaveBeenCalled();
 });
 it('rejects invalid search strings', async () => {
   await expect(new GsmarenaProvider(client()).search(' ')).rejects.toThrow(RangeError);
 });
 it('reports rate limiting instead of an empty result', async () => {
   const c=client(); c.search.search.mockRejectedValueOnce({ response: { status: 429 } });
   await expect(new GsmarenaProvider(c).search('iphone 13')).rejects.toBeInstanceOf(ProviderRateLimitedError);
 });
 it('reports provider outage without leaking upstream errors', async () => {
   const c=client(); c.search.search.mockRejectedValueOnce(new Error('sensitive upstream detail'));
   await expect(new GsmarenaProvider(c).search('iphone 13')).rejects.toBeInstanceOf(ProviderUnavailableError);
 });
 it('rejects unexpected provider payloads', async () => {
   const c=client(); c.catalog.getDevice.mockResolvedValueOnce({ name:'Broken' } as never);
   await expect(new GsmarenaProvider(c).getById('apple_iphone_13-11103')).rejects.toBeInstanceOf(ProviderResponseError);
 });
});
