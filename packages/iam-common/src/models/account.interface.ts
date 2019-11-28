import { PasswordStash } from './password-stash.interface';
import { AccountLink } from './account-link.interface';
import { AccessToken } from './access-token.interface';
import { Role } from './role.interface';
import { AccountEmail } from './account-email.interface';
import { AccountPhone } from './account-phone.interface';
import { AccountMessenger } from './account-messenger.interface';
import { AccountAddress } from './account-address';
import { AccountEmployement } from './account-employment.interface';
import { Group } from './group.interface';
import { AccountCredential } from './account-credential.interface';
import { GroupMapping } from './group-mapping.interface';
import { RoleMapping } from './role-mapping.interface';


export interface Account
{
	id:any
	username:string
	email:string
	firstName:string
	lastName:string
	gender:string
	nip:string
	avatarUri:string

	verified:boolean
	verificationToken:string
	enabled:boolean

	isPasswordActive(password):Promise<boolean>
	isActiveEmployee():Promise<boolean>

	stash:PasswordStash[]
	links:AccountLink[]
	emails:AccountEmail[]
	phones:AccountPhone[]
	messengers:AccountMessenger[]
	addresses:AccountAddress[]
	//employements:AccountEmployement[]
	tokens:AccessToken[]
	credential:AccountCredential
	roles:RoleMapping[]
	groups:GroupMapping[]
}