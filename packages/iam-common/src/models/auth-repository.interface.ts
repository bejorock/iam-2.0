
export interface AuthRepository
{
	id:any
	name:string
	domain:string
	url:string
	baseDn:string
	credentialId:string
	credentialPassword:string
	uidIs:string
	objectclassesIs:string[]
	entryUUIDIs:string
	scopes:string[]
}