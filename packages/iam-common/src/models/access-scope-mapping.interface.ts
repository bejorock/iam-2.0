import { Role } from './role.interface';
import { AccessScope } from './access-scope.interface';

export interface AccessScopeMapping
{
	id:any
	roleId:any
	scopeId:any 
	created:Date
	ttl:number

	role:Role
	scope:AccessScope
}