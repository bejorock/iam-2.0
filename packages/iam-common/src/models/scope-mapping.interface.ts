import { Policy } from './policy.interface';
import { Scope } from './scope.interface';

export interface ScopeMapping
{
	id:any
	policyId:any
	scopeId:any
	created:Date
	ttl:number

	policy:Policy
	//scope:Scope
}