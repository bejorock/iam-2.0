import { PersistedDao, PersistedModel } from 'loopback-typescript-core/dist/models/persisted.model';
import { Property, CommonModel, Relation } from 'loopback-typescript-core/dist/models/decorators';
import { injectable } from 'inversify';
import { environment } from '../environment';
import { AccountCredential } from '../models/account-credential.interface';
import { AuthRepositoryModel } from './auth-repository.model';
import { AccountModel } from './account.model';

@injectable()
export class AccountCredentialDao extends PersistedDao
{
	static tableName = 'iam_account_credential'
	static modelName = 'AccountCredential'

	ModelClass = AccountCredentialModel
}

@injectable()
@CommonModel({
	name: AccountCredentialDao.modelName,
	dao: AccountCredentialDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'account_credentials',
		mongodb: {
			collection: AccountCredentialDao.tableName
		},

		mixins: {
			ObjectidType: {
				properties: ["accountId", "repositoryId"]
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
export class AccountCredentialModel extends PersistedModel implements AccountCredential
{
	@Property('any', true)
	accountId: any;
	
	@Property('any', true)
	repositoryId: any;

	@Property('string')
	cn: string;

	@Property('string')
	dn: string;

	@Property('string')
	uid: string;

	@Property('string')
	entryUUID: string;

	@Property({type: ['string']})
	objectClass: string[];

	@Property('any')
	meta: any;

	@Property('boolean')
	enabled: boolean;

	@Property('number')
	uSNChanged: number

	@Relation('belongsTo', 'Account', 'accountId')
	account: AccountModel;

	@Relation('belongsTo', 'AuthRepository', 'repositoryId')
	repository: AuthRepositoryModel;
}