import { AccessToken } from './access-token.interface';
import { AuthService } from './auth-service.interface';
import { Policy } from './policy.interface';
export interface Client
{
	id:any
	authServiceId:any
	name:string
	contacts:string[]
	applicationType:string
	clientId:string
	clientSecret:string
	url:string
	scopes:string[]
	logoUri:string
	secure:boolean
	enabled:boolean
	created:Date
	ttl:number
	groupId:any
	accountId:any

	tokens:AccessToken[]
	policies:Policy[]
	authService:AuthService
}