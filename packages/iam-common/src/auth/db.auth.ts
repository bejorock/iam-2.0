import { Authenticator, Credential, AuthResponse } from './base.auth';
import { injectable, inject } from 'inversify';
import { AuthError } from '../util/error.throw';
import { AccountDao, AccountModel, AccountCredentialDao, AccountCredentialModel } from '../dao';

@injectable()
export class DbAuthenticator implements Authenticator
{
	@inject(AccountDao)
	accountDao:AccountDao

	@inject(AccountCredentialDao)
	credentialDao:AccountCredentialDao

	async authenticate(credential: Credential) {
		let filter:any;
		if(credential.userId.indexOf('@') > -1) {
			filter = {email: {like: `^${credential.userId}$`, options: 'i'} }
		} else if(/^\d{4,}.*/.test(credential.userId)) {
			filter = {nip: {like: `^${credential.userId}$`, options: 'i'} }
		} else {
			filter = {username: {like: `^${credential.userId}$`, options: 'i'} }
		}

		let account = await this.accountDao.findOne<AccountModel>({where: filter})
		if(!account)
			throw new AuthError(AuthError.USER_NOT_FOUND, {})
		
		// check if has credential which means its ad user
		let accountCredential = await this.credentialDao.findOne<AccountCredentialModel>({
			where: { accountId: account.id }
		})

		if(accountCredential)
			throw new AuthError(AuthError.USER_HAS_DOMAIN, {account, accountCredential})

		//if(account.nip)
		//	throw new AuthError(AuthError.USER_HAS_DOMAIN)

		let isMatch = await account.hasPassword(credential.password)

		if(!isMatch)
			throw new AuthError(AuthError.INVALID_PASSWORD, account)

		let isPasswordActive = await account.isPasswordActive(credential.password)
		
		if(!isPasswordActive)
			throw new AuthError(AuthError.PASSWORD_EXPIRED, account)

		return {
			userId: credential.userId,
			account: account
		}
	}	
}