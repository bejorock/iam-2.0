import { AccountCredential } from "../models";
import { AccountModel } from "../dao";

export interface Credential
{
	userId:string
	consentId?:string
	password?:string
	passwordCheck?:string
	domain?:string
	captcha?:string
}

export interface AuthResponse
{	
	userId:any
	account?:AccountModel
	identity?:AccountCredential
	permanent?:boolean
}

export interface Authenticator 
{
	authenticate(credential:Credential):Promise<AuthResponse>
}