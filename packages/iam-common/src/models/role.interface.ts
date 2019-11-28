import { Account } from './account.interface';

export interface Role
{
	id:any
	name:string
	description:string
	enabled:boolean

	accounts:Account[]
}