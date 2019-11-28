import { Account } from "./account.interface";

export interface AccountEmail
{
	id:any
	accountId:any
	alias:string
	email:string
	verified:boolean
	verificationToken:string
	created:Date
	ttl:number
	enabled:boolean

	account:Account
}