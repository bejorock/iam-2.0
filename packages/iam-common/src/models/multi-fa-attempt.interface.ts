import { LoginAttempt } from './login-attempt.interface';

export interface MultiFactorAuthAttempt
{
	id:any
	loginAttemptId:any
	code:string
	submittedCode:string
	created:Date
	ttl:number
	success:boolean
	blocked:boolean

	loginAttempt:LoginAttempt
}