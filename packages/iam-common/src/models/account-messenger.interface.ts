import { Account } from './account.interface';

export interface AccountMessenger
{
	id:any
	accountId:any
	uid:string
	provider:string
	token:string
	url:string
	verified:boolean
	verificationToken:string
	created:Date
	ttl:number
	enabled:boolean

	account:Account
}