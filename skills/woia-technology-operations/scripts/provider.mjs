import {authorize,beginEffect,reconcileEffect,guard} from './authority-effect.mjs';
export {dispatchPending,digest} from './authority-effect.mjs';
export const actions=["technology.binding.read","technology.binding.apply","technology.access.apply","technology.access.revoke","technology.health.observe","technology.inventory.read","technology.backup.observe","technology.restore.execute","technology.change.execute","technology.recovery.reconcile"];
export const initialState=(organization,scope)=>{guard(organization&&scope,'STATE_SCOPE_REQUIRED');return{organization,scope,revision:0,bindings:{},access:{},observations:[],effects:{}}};
export function apply(state,c,a){
 guard(state.organization===c.organization&&state.scope===c.scope,'STATE_SCOPE_MISMATCH');
 guard(actions.includes(c.action),'UNKNOWN_ACTION');
 const read=['technology.binding.read','technology.inventory.read'].includes(c.action);
 authorize(c,a,'Technology',read);
 if(read) return c.action==='technology.binding.read'?structuredClone(state.bindings[c.resource_id]??null):structuredClone({bindings:state.bindings,access:state.access});
 if(c.action==='technology.recovery.reconcile')return{state:reconcileEffect(state,c,a,'Technology')};
 if(c.action==='technology.restore.execute'){
 guard(c.payload.backup_id&&c.payload.backup_checksum&&c.payload.reconciliation_plan&&c.payload.preserve_revocations===true&&c.payload.external_effects_rollback===false,'RESTORE_BOUNDARY_REQUIRED');
 }
 if(c.action==='technology.access.apply'){
 guard(c.payload.subject_id&&Array.isArray(c.payload.permissions)&&c.payload.accepted_authority_contribution&&c.payload.expires_at>a.now,'ACCESS_CONTRIBUTION_REQUIRED');
 const prior=state.access[c.payload.subject_id];
 guard(!prior?.revoked || (c.payload.new_grant_id && c.payload.supersedes_revocation===prior.revocation_id && a.authority_revision!==prior.authority_revision),'REVOKED_GRANT_REQUIRES_NEW_AUTHORITY');
 }
 if(c.action==='technology.access.revoke')guard(c.payload.subject_id&&c.payload.revocation_id,'REVOCATION_REQUIRED');
 if(c.action==='technology.binding.apply')guard(c.payload.binding_id&&c.payload.config_revision&&c.payload.target_id&&!c.payload.credentials,'VERSIONED_BINDING_REQUIRED');
 if(c.action==='technology.change.execute')guard(c.payload.change_id&&c.payload.recovery_plan&&c.payload.expected_target_revision,'CHANGE_RECOVERY_REQUIRED');
 if(['technology.health.observe','technology.backup.observe'].includes(c.action)){
 guard(c.expected_revision===state.revision&&c.payload.source_id&&c.payload.evidence_id&&Number.isFinite(c.payload.observed_at),'OBSERVATION_REQUIRED');
 const n=structuredClone(state);n.observations.push({action:c.action,resource_id:c.resource_id,...structuredClone(c.payload)});n.revision++;return{state:n};
 }
 return beginEffect(state,c,a,'Technology');
}
export function projectSucceeded(state,effectId,organization,scope){
 guard(state.organization===organization&&state.scope===scope,'STATE_SCOPE_MISMATCH');
 const e=state.effects[organization+'/'+scope+'/'+effectId];guard(e?.status==='SUCCEEDED','SUCCESS_EVIDENCE_REQUIRED');
 if(e.projected)return state;
 const n=structuredClone(state),c=e.command;
 if(c.action==='technology.binding.apply')n.bindings[c.resource_id]=structuredClone(c.payload);
 if(c.action==='technology.access.apply')n.access[c.payload.subject_id]={...structuredClone(c.payload),revoked:false,authority_revision:e.authority_revision};
 if(c.action==='technology.access.revoke')n.access[c.payload.subject_id]={...(n.access[c.payload.subject_id]??{}),revoked:true,revocation_id:c.payload.revocation_id,authority_revision:e.authority_revision};
 // Restore/change do not import old permissions or undo observed external Effects.
 n.effects[organization+'/'+scope+'/'+effectId].projected=true;n.revision++;return n;
}
