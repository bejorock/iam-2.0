import { PersistedDao, PersistedModel } from "loopback-typescript-core/dist/models/persisted.model";
import { injectable } from "inversify";
import { CommonModel, Property, Relation } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { AccountMessenger } from "../models/account-messenger.interface";
import { AccountModel } from './account.model';

@injectable()
export class AccountMessengerDao extends PersistedDao
{
	static tableName = 'iam_account_messenger'
	static modelName = 'AccountMessenger'

	ModelClass = AccountMessengerModel
}

@injectable()
@CommonModel({
	name: AccountMessengerDao.modelName,
	dao: AccountMessengerDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'account_messengers',
		mongodb: {
			collection: AccountMessengerDao.tableName
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
export class AccountMessengerModel extends PersistedModel implements AccountMessenger
{
	@Property('any', true)
	accountId: any;	

	@Property('string', true)
	uid: string;

	@Property('string', true)
	provider: string;

	@Property('string')
	token: string;

	@Property('string')
	url: string;

	@Property('boolean')
	verified: boolean;

	@Property('string')
	verificationToken: string;

	@Property('date')
	created: Date;

	@Property('number')
	ttl: number;

	@Property('boolean')
	enabled: boolean;

	@Relation('belongsTo', 'Account', 'accountId')
	account: AccountModel;
}