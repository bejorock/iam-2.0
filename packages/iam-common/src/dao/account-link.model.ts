import { PersistedModel, PersistedDao } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable } from 'inversify';
import { Property, CommonModel, Relation } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { AccountLink } from '../models/account-link.interface';
import { AccountModel } from './account.model';

@injectable()
export class AccountLinkDao extends PersistedDao
{
	static tableName = 'iam_account_link'
	static modelName = 'AccountLink'

	ModelClass = AccountLinkModel
}

@injectable()
@CommonModel({
	name: AccountLinkDao.modelName,
	dao: AccountLinkDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'account_links',
		mongodb: {
			collection: AccountLinkDao.tableName
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
export class AccountLinkModel extends PersistedModel implements AccountLink
{
	@Property('any', true)
	refId: any;	

	@Property('any', true)
	accountId: any;

	@Property('any', true)
	principalId: any;

	@Property('string', true)
	principalType: string;

	@Property('string')
	link: string;

	@Property('string')
	protocol: string;

	@Property('string')
	host: string;

	@Property('string')
	port: string;

	@Property('string')
	path: string;

	@Property('string')
	token: string;

	@Property('date')
	created: Date;

	@Property('number')
	ttl: number;

	@Property('boolean')
	enabled: boolean;

	@Relation('belongsTo', 'Account', 'accountId')
	account: AccountModel;	
}