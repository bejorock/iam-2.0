export interface PasswordStash
{
	id:any
	created:Date
	ttl:number
	temporary:boolean
	password:string

	isExpired():boolean

	accountId:any
}