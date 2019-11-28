import { PersistedModel, PersistedDao } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable, inject } from 'inversify';
import { CommonModel, Property, Relation, Hook } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { Client } from '../models/client.interface';
import { AccessTokenModel } from './access-token.model';
import { PolicyModel, PolicyDao } from './policy.model';
import { AuthServiceModel } from './auth-service.model';
import { ScopeDao } from './scope.model';

@injectable()
export class ClientDao extends PersistedDao
{
	static tableName = 'iam_client'
	static modelName = 'Client'

	ModelClass = ClientModel

	@inject('Factory<iam.Resolver>') iamResolver: (ctxClass) => any

	@Hook('after delete')
	async cleanup(ctx) {
		let policyDao = this.iamResolver(PolicyDao)
		let scopeDao = this.iamResolver(ScopeDao)
		//console.log(ctx)
		if(ctx.where.id) {
			await policyDao.destroyAll({ clientId: ctx.where.id })
			await scopeDao.destroyAll({ clientId: ctx.where.id })
		}
	}
}

@injectable()
@CommonModel({
	name: ClientDao.modelName,
	dao: ClientDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'clients',
		mongodb: {
			collection: ClientDao.tableName
		},

		mixins: {
			ObjectidType: {
				properties: ["authServiceId", "accountId", "groupId"]
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
export class ClientModel extends PersistedModel implements Client
{
	@Property('any', true)
	authServiceId: any;
	
	@Property('string', true)
	name: string;

	@Property({type: ['string']})
	contacts: string[];

	@Property('string')
	applicationType: string;

	@Property('string', true)
	clientId: string;

	@Property('string', true)
	clientSecret: string;

	@Property('string')
	url: string;

	@Property({type: ['string']})
	scopes: string[];

	@Property('string')
	logoUri: string;

	@Property('boolean')
	secure: boolean;

	@Property('boolean')
	enabled: boolean;

	@Property('boolean')
	published: boolean;

	@Property('boolean')
	adminonly: boolean;

	@Property('date')
	created: Date;

	@Property('number')
	ttl: number;

	@Property('any')
	accountId: any;

	@Property('any')
	groupId: any;

	@Property('boolean')
	allowedRefresh:boolean

	@Relation('hasMany', 'eAccessToken')
	tokens: AccessTokenModel[];

	@Relation('hasMany', 'Policy', 'clientId')
	policies: PolicyModel[];
	
	@Relation('belongsTo', 'AuthService', 'authServiceId')
	authService: AuthServiceModel;

	@Relation('belongsTo', 'Account', 'accountId')
	account

	@Relation('belongsTo', 'Group', 'groupId')
	group
}