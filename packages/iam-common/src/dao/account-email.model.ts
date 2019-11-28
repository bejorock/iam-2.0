import { PersistedDao, PersistedModel } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable } from 'inversify';
import { CommonModel, Property, Relation } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { AccountEmail } from '../models/account-email.interface';
import { AccountModel } from './account.model';

@injectable()
export class AccountEmailDao extends PersistedDao
{
	static tableName = 'iam_account_email'
	static modelName = 'AccountEmail'

	ModelClass = AccountEmailModel
}

@injectable()
@CommonModel({
	name: AccountEmailDao.modelName,
	dao: AccountEmailDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'account_emails',
		mongodb: {
			collection: AccountEmailDao.tableName
		},

		mixins: {
			ObjectidType: {
				properties: ["accountId"]
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
			"accessType": "WRITE",
			"property": "create",
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
export class AccountEmailModel extends PersistedModel implements AccountEmail
{
	@Property('any', true)
	accountId: any;	

	@Property('string')
	alias: string;

	@Property('string', true)
	email: string;

	@Property('boolean')
	verified: boolean;

	@Property('string')
	verificationToken: string;

	// deprecated
	@Property('date')
	created: Date;

	// deprecated
	@Property('number')
	ttl: number;

	@Property('boolean')
	enabled: boolean;

	@Relation('belongsTo', 'Account', 'accountId')
	account: AccountModel;	
}