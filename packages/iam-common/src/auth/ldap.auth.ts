import ldap from 'ldapjs'
import { Authenticator, Credential, AuthResponse } from './base.auth';
import { injectable, inject } from 'inversify';
import { Util } from '../util/util';
import { AuthError } from '../util/error.throw';
import { AuthRepositoryModel } from '../dao';
import { AccountCredential } from '../models';

@injectable()
export class LdapAuthenticator implements Authenticator
{
	log = Util.logger('LDAP Authenticator', 'debug')

	repo:AuthRepositoryModel

	async authenticate(credential: Credential) {
		let filter = '';
		if(credential.userId.indexOf('@') > -1) {
			filter = `(&(mail=${credential.userId})${this.repo.objectclassesIs.map(value => `(objectClass=${value})`).join('')})`
		} else if(/^\d{4,}.*/.test(credential.userId)) {
			//filter = `(&(employeeNumber=${credential.userId})${this.repo.objectclassesIs.map(value => `(objectClass=${value})`).join('')})`
			filter = `(&(employeeNumber=${credential.userId})${this.repo.objectclassesIs.map(value => `(objectClass=${value})`).join('')})`
		} else {
			filter = `(&(${this.repo.uidIs}=${credential.userId})${this.repo.objectclassesIs.map(value => `(objectClass=${value})`).join('')})`
		}

		let entry:AccountCredential = <AccountCredential> await this.search(this.repo, {filter, scope: 'sub'})
		if(!entry)
			throw new AuthError(AuthError.USER_NOT_FOUND)

		if(this.isPasswordExpired(entry.meta))
			throw new AuthError(AuthError.PASSWORD_EXPIRED, entry)

		try {
			this.log.info('bind with provided username and password')
			await this.bind(entry.dn, credential.password)
		} catch(e) { 
			this.log.error(e)
			throw new AuthError(AuthError.INVALID_PASSWORD)
		}

		let authRes:AuthResponse = {
			userId: credential.userId,
			identity: entry,
			permanent: await this.isPasswordNeverExpired(entry.meta)
		}

		return authRes
	}	

	isPasswordExpired(meta) {
		let timeAdjust = 11644473600000
		let now = new Date()
		let pwdLastSet = new Date()
		pwdLastSet.setDate(now.getDate() + 30)
		
		if(this.isPasswordNeverExpired(meta))
			return false

		if(meta.pwdLastSet) {
			pwdLastSet = new Date(parseInt(meta.pwdLastSet)/10000 - timeAdjust)
			pwdLastSet.setDate(pwdLastSet.getDate() + 30)

			meta.newPwdExpired = pwdLastSet

			if(now.getTime() > pwdLastSet.getTime()) {
				return true
			}
		} else 
			meta.newPwdExpired = pwdLastSet

		return false
	}

	isPasswordNeverExpired(meta) {
		if(meta.userAccountControl) {
			let userAccountControl = parseInt(meta.userAccountControl)
			if(!(userAccountControl & 65536)) {
				return false
			} else 
				return true
		}

		return false
	}
	
	parse(meta: any) {
		let credential:AccountCredential = {
			id: undefined,
			accountId: undefined,
			entryUUID: undefined,
			account: undefined,
			repository: this.repo,
			uid: meta[this.repo.uidIs],
			cn: meta.cn,
			dn: meta.dn,
			objectClass: meta.objectclass || meta.objectClass,
			repositoryId: this.repo.id,
			enabled: true,
			meta: Object.assign({}, meta, {
				email: Util.parseEmail(meta.mail, meta[this.repo.uidIs]),
				firstName: Util.assure(meta.givenName),
				lastName: Util.assure(meta.sn),
				nip: Util.parseNip(meta.description)	
			})
		}

		return credential
	}

	async bind(dn, password) {
		// get connection
		let client = await this.createClient()

		await new Promise((resolve, reject) => {
			try {
				client.bind(dn, password, (err) => {
					if(err) reject(err)
					else resolve()
				})
			} catch(e) {reject(e)}
		})

		// disconnect client
		client.destroy()

		return true
	}

	async search(repo, filter) {
		// get connection
		let client = await this.createClient()
		let entry

		try {
			await Util.toPromise(client, client.bind, [`${repo.credentialId},${repo.baseDn}`, repo.credentialPassword])

			entry = await new Promise((resolve, reject) => {
				try {
					client.search(this.repo.baseDn, filter, (err, res) => {
						if(err) reject(err)
						else {
							res.on('searchEntry', (entry) => resolve(this.parse(entry.object)))
							res.on('error', (err) => reject(err))
							res.on('end', () => resolve(null))
						}
					})
				} catch(e) {reject(e)}
			})
		} catch(e) {
			client.destroy()
			throw e
		}

		// disconnect client
		client.destroy()

		return entry
	}

	createClient():Promise<any> {
		let client = ldap.createClient({
			url: this.repo.url,
			timeout: 10000,
			connectTimeout: 10000,
			tlsOptions: { rejectUnauthorized: false }
		})

		return new Promise((resolve, reject) => {
			client.on('connect', () => {
				resolve(client)
			})

			client.on('error', (err) => reject(err))

			client.on('connectError', (err) => reject(err))

			client.on('timeout', (err) => reject(err))

			//client.on('end', (err) => reject(err))

			//client.on('close', (err) => reject(err))

			//client.connect()
		})
	}
}