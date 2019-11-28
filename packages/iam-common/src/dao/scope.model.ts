import { PersistedDao, PersistedModel } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable, inject } from 'inversify';
import { Property, CommonModel, Relation, Hook } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { Scope } from '../models/scope.interface';
import { ScopeMappingDao } from './scope-mapping.model';

@injectable()
export class ScopeDao extends PersistedDao
{
	static tableName = 'iam_scope'
	static modelName = 'Scope'

	ModelClass = ScopeModel

	@inject('Factory<iam.Resolver>') iamResolver: (ctxClass) => any

	@Hook('after delete')
	async cleanup(ctx) {
		let scopeMappingDao = this.iamResolver(ScopeMappingDao)
		//console.log(ctx)
		if(ctx.where.id) {
			await scopeMappingDao.destroyAll({ scopeId: ctx.where.id })
		}
	}
}

@injectable()
@CommonModel({
	name: ScopeDao.modelName,
	dao: ScopeDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'scopes',
		mongodb: {
			collection: ScopeDao.tableName
		},

		mixins: {
			ObjectidType: {
				properties: ['clientId']
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
export class ScopeModel extends PersistedModel implements Scope
{
	@Property('string', true)
	name: string;	

	@Property('string')
	action: string;

	@Property('string')
	path: string

	@Property('any')
	clientId: any

	@Property('boolean')
	enabled: boolean;

	@Relation('belongsTo', 'Client', 'clientId')
	client
}