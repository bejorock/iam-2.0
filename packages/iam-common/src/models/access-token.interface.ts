import { Account } from "./account.interface";
import { Client } from "./client.interface";

export interface AccessToken
{
	id:any
	ttl:number
	scopes:string[]
	created:Date
	userId:any
	clientId:any
	device:string
	userAgent:string
	ip:string
	refreshToken:string
	source:string
	flag1:string
	flag2:string

	settings:any

	user:Account
	client:Client
}