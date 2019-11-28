import { Client } from './client.interface';

export interface AuthService
{
	id:string
	name:string
	authUrl:string
	provider:string
	settings:any

	clients:Client[]
}