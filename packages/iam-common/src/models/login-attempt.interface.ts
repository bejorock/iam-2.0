import { Account } from './account.interface';
import { Client } from './client.interface';
import { CaptchaAttempt } from './captcha-attempt.interface';
import { MultiFactorAuthAttempt } from './multi-fa-attempt.interface';
export interface LoginAttempt
{
	id:any
	created:Date
	ttl:number
	accountId:any
	clientId:any
	device:string
	userAgent:string
	ip:string
	source:string
	url:string
	status:string
	scopes:string[]
	count:number
	success:boolean
	blocked:boolean
	relogin:boolean
	fromId:any

	from:LoginAttempt
	account:Account
	client:Client
	captcha:CaptchaAttempt
	multiFa:MultiFactorAuthAttempt
}