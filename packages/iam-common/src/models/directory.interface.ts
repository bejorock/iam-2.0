import { DirectoryEntry } from './directory-entry.interface';

export interface Directory
{
	id:any
	cn:string
	dn:string
	root:any
	created:Date
	ttl:number
	enabled:boolean

	entry:DirectoryEntry
}