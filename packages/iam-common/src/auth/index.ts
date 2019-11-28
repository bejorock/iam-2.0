import { Container } from 'inversify';
import { Credential, Authenticator } from './base.auth';
import { AuthRepositoryDao, AuthRepositoryModel, AccountDao, AccountModel } from '../dao';
import { DbAuthenticator } from './db.auth';
import { from, throwError, timer, of } from 'rxjs';
import { switchMap, mergeMap, retryWhen, tap, delayWhen, catchError, last, first, filter, reduce, shareReplay, map } from 'rxjs/operators';
import { LdapAuthenticator } from './ldap.auth';
import { Util } from '../util';
import { AuthError } from '../util/error.throw';
import ldap from 'ldapjs';
import * as _ from 'lodash';

export * from './base.auth'
export * from './db.auth'
export * from './ldap.auth'

export function authenticate(container:Container, credential:Credential, log:any = Util.consoleLog) {
	if(_.isEmpty(credential.userId) || _.isEmpty(credential.password))
		throw new AuthError(AuthError.INVALID_PASSWORD)
	
	//let accountDao = container.get(AccountDao) as AccountDao
	let repoDao = container.get(AuthRepositoryDao) as AuthRepositoryDao

	let dbAuthenticator = container.resolve(DbAuthenticator) as Authenticator

	let findRepos = from(repoDao.find<AuthRepositoryModel>({where: {enabled: true}}))

	let lastError:any = undefined
	let result = from(dbAuthenticator.authenticate({ userId: credential.userId, password: credential.password })).pipe(
		catchError(err => {
			if(!(err instanceof AuthError))
				return throwError(err)
			
			if(!err.isDomainUser && !err.isUserNotFound)
				return throwError(err)

			let {account, accountCredential} = err.entity

			return findRepos.pipe(
				mergeMap(repos => from(repos).pipe(filter(repo => (accountCredential ? accountCredential.repositoryId.toString() === repo.id.toString() : true)))),
				map(repo => {
					const authenticator = container.resolve(LdapAuthenticator)
		
					authenticator.repo = repo

					return authenticator as Authenticator
				}),
				mergeMap(authenticator => {
					let retryAttempt = 1
		
					return from(authenticator.authenticate({
						userId: (account ? account.username : credential.userId),
						password: credential.password
					})).pipe(
						retryWhen(errors =>
							errors.pipe(
								//log error message
								tap(val => log.debug(`${val}`)),
								//tap(val => console.log(val instanceof ldap.ConnectionError)),
								tap(val => {
									if(authenticator instanceof DbAuthenticator)
										log.debug(`retrying... ${retryAttempt}/3 mongodb`)
									else
										log.debug(`retrying... ${retryAttempt}/3 ${(authenticator as LdapAuthenticator).repo.url}`)
								}),
								//restart in 5 seconds
								delayWhen(val => 
									(
										retryAttempt++ >= 3 || !(val instanceof ldap.ConnectionError)  ? 
										throwError(val) :
										//of(val) :  
										timer(5000)
									)
								)
							)
						),
						catchError(error => of(error))
					)
				}),
				tap(val => {
					if(val instanceof ldap.ConnectionError) 
						val = new AuthError(AuthError.REPOSITORY_UNREACHABLE)
		
					if(val instanceof AuthError) {
						if(!lastError)
							lastError = val
						else if(val.status > lastError.status)
							lastError = val
					}
				}),
				filter(val => !(val instanceof Error)),
				first(val => !!val),
				catchError(err => throwError(lastError || new AuthError(AuthError.USER_NOT_FOUND)))
			)
		})
	)

	/* let result = findRepos.pipe(

		switchMap(repos => 
			from([dbAuthenticator].concat(repos.map(repo => {
				const authenticator = container.resolve(LdapAuthenticator)

				authenticator.repo = repo

				return authenticator as Authenticator
			})))
		),
		mergeMap(authenticator => {
			let retryAttempt = 1

			return from(authenticator.authenticate({
				userId: credential.userId,
				password: credential.password
			})).pipe(
				retryWhen(errors =>
					errors.pipe(
						//log error message
						tap(val => log.debug(`${val}`)),
						//tap(val => console.log(val instanceof ldap.ConnectionError)),
						tap(val => {
							if(authenticator instanceof DbAuthenticator)
								log.debug(`retrying... ${retryAttempt}/3 mongodb`)
							else
								log.debug(`retrying... ${retryAttempt}/3 ${(authenticator as LdapAuthenticator).repo.url}`)
						}),
						//restart in 5 seconds
						delayWhen(val => 
							(
								retryAttempt++ >= 3 || !(val instanceof ldap.ConnectionError)  ? 
								throwError(val) :
								//of(val) :  
								timer(5000)
							)
						)
					)
				),
				catchError(error => of(error))
			)
		}),
		tap(val => {
			if(val instanceof ldap.ConnectionError) 
				val = new AuthError(AuthError.REPOSITORY_UNREACHABLE)

			if(val instanceof AuthError) {
				if(!lastError)
					lastError = val
				else if(val.status > lastError.status)
					lastError = val
			}
		}),
		filter(val => !(val instanceof Error)),
		first(val => !!val),
		catchError(err => throwError(lastError || new AuthError(AuthError.USER_NOT_FOUND)))
	) */

	return result.toPromise()
}