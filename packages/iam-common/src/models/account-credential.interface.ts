import { Account } from "./account.interface";
import { AuthRepository } from "./auth-repository.interface";

export interface AccountCredential
{
	id:any
	accountId:any
	repositoryId:any
	cn:string
	dn:string
	uid:string
	entryUUID:string
	objectClass:string[]
	meta:any
	enabled:boolean

	account:Account
	repository:AuthRepository
}