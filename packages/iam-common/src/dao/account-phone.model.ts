import { PersistedDao, PersistedModel } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable } from 'inversify';
import { CommonModel, Property, Relation } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { AccountPhone } from '../models/account-phone.interface';
import { AccountModel } from './account.model';

@injectable()
export class AccountPhoneDao extends PersistedDao
{
	static tableName = 'iam_account_phone'
	static modelName = 'AccountPhone'

	ModelClass = AccountPhoneModel
}

@injectable()
@CommonModel({
	name: AccountPhoneDao.modelName,
	dao: AccountPhoneDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'account_phones',
		mongodb: {
			collection: AccountPhoneDao.tableName
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
export class AccountPhoneModel extends PersistedModel implements AccountPhone
{
	@Property('any', true)
	accountId: any;
	
	@Property('string')
	alias: string;

	@Property('string', true)
	phone: string;

	@Property('string')
	countryCode: string;

	@Property('boolean')
	verified: boolean;

	@Property('string')
	verificationToken: string;

	@Property('date')
	created: Date;

	@Property('number')
	ttl: number;

	@Relation('belongsTo', 'Account', 'accountId')
	account: AccountModel;
}