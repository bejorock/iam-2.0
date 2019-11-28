import { Account } from './account.interface';
import { Group } from './group.interface';

export interface GroupMapping
{
	id:any
	accountId:any
	groupId:any
	role:string
	owner:boolean
	enabled:boolean
	created:Date
	ttl:number

	account:Account
	group:Group
}