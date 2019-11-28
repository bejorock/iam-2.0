import { Account } from "./account.interface";

export interface AccountAddress
{
	id:any
	accountId:any
	address:string
	country:string
	province:string
	city:string
	zipCode:string
	verified:boolean
	verificationInfo:string
	created:Date
	ttl:number
	enabled:boolean

	account:Account
}