import { PersistedDao, PersistedModel } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable } from 'inversify';
import { CommonModel, Property, Relation } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { AccountAddress } from '../models/account-address';
import { AccountModel } from './account.model';

@injectable()
export class AccountAddressDao extends PersistedDao
{
	static tableName = 'iam_account_address'
	static modelName = 'AccountAddress'

	ModelClass = AccountAddressModel
}

@injectable()
@CommonModel({
	name: AccountAddressDao.modelName,
	dao: AccountAddressDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'account_addresses',
		mongodb: {
			collection: AccountAddressDao.tableName
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
export class AccountAddressModel extends PersistedModel implements AccountAddress
{
	@Property('any', true)
	accountId: any;	

	@Property('string', true)
	address: string;

	@Property('string')
	country: string;

	@Property('string')
	province: string;

	@Property('string')
	city: string;

	@Property('string')
	zipCode: string;

	@Property('boolean')
	verified: boolean;

	@Property('string')
	verificationInfo: string;

	@Property('date')
	created: Date;

	@Property('number')
	ttl: number;

	@Property('boolean')
	enabled: boolean;

	@Relation('belongsTo', 'Account', 'accountId')
	account: AccountModel;
}