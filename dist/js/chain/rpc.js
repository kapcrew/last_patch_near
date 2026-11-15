export function parseBounty(raw) { if (!raw || typeof raw !== 'object')
    throw new Error('Invalid contract response'); const d = raw; if (!Number.isSafeInteger(d.id) || typeof d.reward_yocto !== 'string' || !/^\d+$/.test(d.reward_yocto) || !['OPEN', 'CLAIMED', 'SUBMITTED', 'APPROVED', 'WITHDRAWING', 'PAID', 'CANCELLING', 'CANCELLED'].includes(String(d.state)))
    throw new Error('Invalid bounty schema from RPC'); return d; }
export async function view(config, method, args = {}) { if (!config.contractId)
    throw new Error('CONTRACT_NOT_CONFIGURED'); const encoded = btoa(Array.from(new TextEncoder().encode(JSON.stringify(args)), x => String.fromCharCode(x)).join('')); const abort = new AbortController(); const timer = setTimeout(() => abort.abort(), 12000); try {
    const response = await fetch(config.rpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 'the-last-patch', method: 'query', params: { request_type: 'call_function', finality: 'final', account_id: config.contractId, method_name: method, args_base64: encoded } }), signal: abort.signal });
    if (!response.ok)
        throw new Error(`RPC HTTP ${response.status}`);
    const result = await response.json();
    if (result.error)
        throw new Error(result.error.message || 'NEAR RPC failed');
    if (!result.result?.result)
        throw new Error('RPC: missing function call result');
    const value = new Uint8Array(result.result.result);
    const json = new TextDecoder().decode(value);
    return JSON.parse(json || 'null');
}
finally {
    clearTimeout(timer);
} }
export async function getBounties(config) {
    const all = [];
    const seen = new Set();
    let offset = 0;
    while (true) {
        if (seen.has(offset))
            throw Error('RPC returned a repeated pagination offset');
        seen.add(offset);
        const page = await view(config, 'list_bounties', { offset, limit: 25 });
        if (!page || !Array.isArray(page.items) || !Number.isSafeInteger(page.total) || !('next_offset' in page))
            throw Error('Malformed bounty list');
        all.push(...page.items.map(parseBounty));
        if (page.next_offset === null) {
            if (all.length !== page.total)
                throw Error('RPC bounty pagination count mismatch');
            return all;
        }
        if (!Number.isSafeInteger(page.next_offset) || page.next_offset <= offset || page.items.length === 0)
            throw Error('RPC returned invalid bounty pagination');
        offset = page.next_offset;
    }
}
export async function rpcHealth(config) { const abort = new AbortController(); const timer = setTimeout(() => abort.abort(), 8000); try {
    const response = await fetch(config.rpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 'tlp-health', method: 'status', params: [] }), signal: abort.signal });
    if (!response.ok)
        throw Error('RPC unavailable');
    const raw = await response.json();
    if (!raw.result)
        throw Error('RPC returned no status');
    return true;
}
finally {
    clearTimeout(timer);
} }
