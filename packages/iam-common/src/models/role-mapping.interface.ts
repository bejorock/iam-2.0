import { Role } from './role.interface';

export interface RoleMapping
{
	id:any
	principalType:string
	principalId:any
	roleId:any
	created:Date
	ttl:number

	role:Role
}