// Wallet Selector v10 with Meteor Wallet (MyNearWallet was discontinued in 2026).
// CDN is pinned because this offline-buildable static distribution cannot bundle packages in the current environment.
// Production deployers can vendor and lock dependencies through a normal audited build pipeline.
import type{Config}from './rpc.js';
type Wallet={signAndSendTransaction:(args:{receiverId:string;actions:unknown[];callbackUrl?:string})=>Promise<unknown>;signOut:()=>Promise<void>};
type Selector={wallet:(id?:string)=>Promise<Wallet>;store:{getState:()=>{accounts:{accountId:string}[];selectedWalletId:string|null}};on:(event:string,callback:()=>void)=>void};
const CORE='https://esm.sh/@near-wallet-selector/core@10.1.4';
const METEOR='https://esm.sh/@near-wallet-selector/meteor-wallet@10.1.4';
const MODAL='https://esm.sh/@near-wallet-selector/modal-ui@10.1.4';
export class NearWallet{
 private selector:Selector|null=null;private modal:{show:()=>void}|null=null;private action:(method:string,args:unknown,gas:bigint,deposit:bigint)=>unknown=()=>{throw Error('Wallet module not ready')};
 accountId:string|null=null;onChange:()=>void=()=>{};
 async init(config:Config){if(!config.contractId)throw new Error('Set contractId in config.json before connecting a Live wallet.');
   let core,walletLib,modalLib;
   try { [core,walletLib,modalLib]=await Promise.all([import(/* @vite-ignore */CORE),import(/* @vite-ignore */METEOR),import(/* @vite-ignore */MODAL)]); }
   catch(e){throw new Error(`Could not load NEAR Wallet Selector from esm.sh. Check browser network, VPN or content blockers. Details: ${e instanceof Error?e.message:String(e)}`)}
   this.action=core.actionCreators.functionCall;
   this.selector=await core.setupWalletSelector({network:'testnet',modules:[walletLib.setupMeteorWallet()]}) as Selector;
   this.modal=modalLib.setupModal(this.selector,{contractId:config.contractId});
   const update=()=>{const state=this.selector!.store.getState();this.accountId=state.accounts?.[0]?.accountId||null;this.onChange();};
   this.selector.on('signedIn',update);this.selector.on('signedOut',update);this.selector.on('accountsChanged',update);update();
 }
 async connect(config:Config){if(!this.selector)await this.init(config);this.modal!.show()}
 async disconnect(){if(!this.selector)return;const w=await this.selector.wallet();await w.signOut();this.accountId=null;this.onChange()}
 async change(config:Config,method:string,args:Record<string,unknown>,deposit='0'){
   if(!config.contractId)throw Error('CONTRACT_NOT_CONFIGURED');if(!this.selector||!this.accountId)throw Error('Connect a testnet wallet first.');
   const w=await this.selector.wallet();const action=this.action(method,args,BigInt('150000000000000'),BigInt(deposit));
   const ret=await w.signAndSendTransaction({receiverId:config.contractId,actions:[action],callbackUrl:location.origin+location.pathname});
   // A wallet may redirect or return an outcome. Caller MUST refresh RPC before treating any transition as successful.
   return ret;
 }
}
