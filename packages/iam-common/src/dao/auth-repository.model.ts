import { PersistedDao, PersistedModel } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable, inject } from 'inversify';
import { CommonModel, Property, Hook } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { AuthRepository } from '../models/auth-repository.interface';
import { AccountCredentialDao } from './account-credential.model';

@injectable()
export class AuthRepositoryDao extends PersistedDao
{
	static tableName = 'iam_auth_repository'
	static modelName = 'AuthRepository'

	ModelClass = AuthRepositoryModel

	@inject('Factory<iam.Resolver>') iamResolver: (ctxClass) => any

	@Hook('before delete')
	async safeDelete(ctx) {
		let credentialDao = this.iamResolver(AccountCredentialDao)

		if(ctx.where.id) {
			let total = await credentialDao.count({ repositoryId: ctx.where.id })

			if(total > 0)
				throw new Error('unable to delete bound entity')
		}
	}
}

@injectable()
@CommonModel({
	name: AuthRepositoryDao.modelName,
	dao: AuthRepositoryDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'auth_repositories',
		mongodb: {
			collection: AuthRepositoryDao.tableName
		},

		mixins: {
			ObjectidType: {
				properties: []
			},
			TimeStamp: true
		}
	},
	acls: [
		{
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "$everyone",
			"permission": "DENY"
		},
		{
			"accessType": "READ",
			"principalType": "ROLE",
			"principalId": "$authenticated",
			"permission": "ALLOW"
		},
		{
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "ssoadmin",
			"permission": "ALLOW"
		},
		/* {
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "$owner",
			"permission": "ALLOW"
		}, */
		{
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "$accountowner",
			"permission": "ALLOW"
		},
		{
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "$accountowner",
			"permission": "ALLOW"
		},
		{
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "$svcrepo",
			"permission": "ALLOW"
		},
		{
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "$svcldap",
			"permission": "ALLOW"
		},
		{
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "$svcemail",
			"permission": "ALLOW"
		},
		{
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "$svcscheduler",
			"permission": "ALLOW"
		},
		{
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "$svcsap",
			"permission": "ALLOW"
		},
		// ini harus ditambah lebih spesifik
		{
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "$hasscope",
			"permission": "ALLOW"
		}
	]
})
export class AuthRepositoryModel extends PersistedModel implements AuthRepository
{
	@Property('string', true)
	name: string;	

	@Property('string', true)
	domain: string;

	@Property('string', true)
	url: string;

	@Property('string', true)
	baseDn: string;

	@Property('string', true)
	credentialId: string;

	@Property('string', true)
	credentialPassword: string;

	@Property('string', true)
	uidIs: string;

	@Property({type:['string']})
	objectclassesIs: string[];

	@Property('string')
	entryUUIDIs: string;

	@Property({type:['string']})
	scopes: string[];

	@Property('boolean')
	enabled:boolean
}