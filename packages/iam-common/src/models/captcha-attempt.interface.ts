import { LoginAttempt } from './login-attempt.interface';

export interface CaptchaAttempt
{
	id:any
	loginAttemptId:any
	captcha:string
	submittedCaptcha:string
	created:Date
	ttl:number
	success:boolean
	blocked:boolean

	loginAttempt:LoginAttempt
}