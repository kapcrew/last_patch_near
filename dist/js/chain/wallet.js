const CORE = 'https://esm.sh/@near-wallet-selector/core@10.1.4';
const METEOR = 'https://esm.sh/@near-wallet-selector/meteor-wallet@10.1.4';
const MODAL = 'https://esm.sh/@near-wallet-selector/modal-ui@10.1.4';
export class NearWallet {
    selector = null;
    modal = null;
    action = () => { throw Error('Wallet module not ready'); };
    accountId = null;
    onChange = () => { };
    async init(config) {
        if (!config.contractId)
            throw new Error('Set contractId in config.json before connecting a Live wallet.');
        let core, walletLib, modalLib;
        try {
            [core, walletLib, modalLib] = await Promise.all([import(/* @vite-ignore */ CORE), import(/* @vite-ignore */ METEOR), import(/* @vite-ignore */ MODAL)]);
        }
        catch (e) {
            throw new Error(`Could not load NEAR Wallet Selector from esm.sh. Check browser network, VPN or content blockers. Details: ${e instanceof Error ? e.message : String(e)}`);
        }
        this.action = core.actionCreators.functionCall;
        this.selector = await core.setupWalletSelector({ network: 'testnet', modules: [walletLib.setupMeteorWallet()] });
        this.modal = modalLib.setupModal(this.selector, { contractId: config.contractId });
        const update = () => { const state = this.selector.store.getState(); this.accountId = state.accounts?.[0]?.accountId || null; this.onChange(); };
        this.selector.on('signedIn', update);
        this.selector.on('signedOut', update);
        this.selector.on('accountsChanged', update);
        update();
    }
    async connect(config) { if (!this.selector)
        await this.init(config); this.modal.show(); }
    async disconnect() { if (!this.selector)
        return; const w = await this.selector.wallet(); await w.signOut(); this.accountId = null; this.onChange(); }
    async change(config, method, args, deposit = '0') {
        if (!config.contractId)
            throw Error('CONTRACT_NOT_CONFIGURED');
        if (!this.selector || !this.accountId)
            throw Error('Connect a testnet wallet first.');
        const w = await this.selector.wallet();
        const action = this.action(method, args, BigInt('150000000000000'), BigInt(deposit));
        const ret = await w.signAndSendTransaction({ receiverId: config.contractId, actions: [action], callbackUrl: location.origin + location.pathname });
        // A wallet may redirect or return an outcome. Caller MUST refresh RPC before treating any transition as successful.
        return ret;
    }
}
