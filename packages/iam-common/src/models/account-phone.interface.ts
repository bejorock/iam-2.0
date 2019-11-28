import { Account } from './account.interface';

export interface AccountPhone
{
	id:any
	accountId:any
	alias:string
	phone:string
	countryCode:string
	verified:boolean
	verificationToken:string
	created:Date
	ttl:number

	account:Account
}