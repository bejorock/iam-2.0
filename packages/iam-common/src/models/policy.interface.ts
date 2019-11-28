import { Client } from './client.interface';
import { Scope } from './scope.interface';

export interface Policy
{
	id:any
	name:string
	role:string
	filters:any
	enabled:boolean
	clientId:any

	client:Client
	scopes:Scope[]
}