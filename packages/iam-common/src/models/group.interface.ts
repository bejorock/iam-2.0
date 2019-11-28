import { Account } from './account.interface';
export interface Group
{
	id:any
	name:string
	description:string
	enabled:boolean

	accounts:Account[]
}