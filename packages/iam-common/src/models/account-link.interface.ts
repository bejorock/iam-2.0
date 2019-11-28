import { Account } from './account.interface';
export interface AccountLink
{
	id:any
	refId:any
	accountId:any
	principalId:any
	principalType:string
	link:string
	protocol:string
	host:string
	port:string
	path:string
	token:string
	created:Date
	ttl:number
	enabled:boolean

	account:Account
}