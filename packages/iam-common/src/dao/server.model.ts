import { PersistedModel, PersistedDao } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable } from 'inversify';
import { CommonModel, Property, Relation } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { Client } from '../models/client.interface';
import { AccessTokenModel } from './access-token.model';
import { PolicyModel } from './policy.model';
import { AuthServiceModel } from './auth-service.model';

@injectable()
export class ServerDao extends PersistedDao
{
	static tableName = 'iam_server'
	static modelName = 'Server'

	ModelClass = ServerModel
}

@injectable()
@CommonModel({
	name: ServerDao.modelName,
	dao: ServerDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'servers',
		mongodb: {
			collection: ServerDao.tableName
		},

		mixins: {
			ObjectidType: {
				properties: ["accountId", "groupId"]
			},
			TimeStamp: true
		}
	},
	acls: [
		{
			"principalType": "ROLE",
      "principalId": "$everyone",
      "permission": "DENY"
		},
		{
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "ssoadmin",
			"permission": "ALLOW"
		},
		{
			"accessType": "READ",
			"principalType": "ROLE",
			"principalId": "$authenticated",
			"permission": "ALLOW"
		},
		{
			"accessType": "WRITE",
			"principalType": "ROLE",
			"principalId": "$accountowner",
			"permission": "ALLOW"
		},
		{
			"accessType": "EXECUTE",
			"principalType": "ROLE",
			"principalId": "$accountowner",
			"permission": "ALLOW"
		},
		{
			"accessType": "WRITE",
			"principalType": "ROLE",
			"principalId": "$groupmember",
			"permission": "ALLOW"
		},
		{
			"accessType": "EXECUTE",
			"principalType": "ROLE",
			"principalId": "$groupmember",
			"permission": "ALLOW"
		}
	]
})
export class ServerModel extends PersistedModel
{
	@Property('string', true)
	name: string;

	@Property({type: ['string']})
	contacts: string[];

	@Property('string')
	serverType: string;

	@Property('string', true)
	clientId: string;

	//@Property('string', true)
	//clientSecret: string;

	@Property('string')
	ip: string;

	@Property('string')
	logoUri: string;

	@Property('boolean')
	enabled: boolean;

	@Property('boolean')
	published: boolean;

	@Property('date')
	created: Date;

	@Property('number')
	ttl: number;

	@Property('any')
	accountId: any;

	@Property('any')
	groupId: any;

	@Relation('hasMany', 'Policy', 'serverId')
	policies: PolicyModel[];
	
	@Relation('belongsTo', 'Account', 'accountId')
	account

	@Relation('belongsTo', 'Group', 'groupId')
	group
}