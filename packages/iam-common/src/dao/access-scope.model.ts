import { PersistedDao, PersistedModel } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable, inject } from 'inversify';
import { CommonModel, Property, Hook } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { AccessScope } from '../models/access-scope.interface';
import { AccessScopeMappingDao } from './access-scope-mapping.model';

@injectable()
export class AccessScopeDao extends PersistedDao
{
	static tableName = 'iam_access_scope'
	static modelName = 'AccessScope'

	ModelClass = AccessScopeModel

	@inject('Factory<iam.Resolver>') iamResolver: (ctxClass) => any

	@Hook('after delete')
	async cleanup(ctx) {
		let scopeMappingDao = this.iamResolver(AccessScopeMappingDao)
		//console.log(ctx)
		if(ctx.where.id) {
			await scopeMappingDao.destroyAll({ scopeId: ctx.where.id })
		}
	}
}

@injectable()
@CommonModel({
	name: AccessScopeDao.modelName,
	dao: AccessScopeDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'access_scopes',
		mongodb: {
			collection: AccessScopeDao.tableName
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
			"principalId": "$account",
			"permission": "ALLOW"
		},
		{
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "$hasscope",
			"permission": "ALLOW"
		}
	]
})
export class AccessScopeModel extends PersistedModel implements AccessScope
{
	@Property('string', true)
	name: string;

	@Property('string')
	category: string; // path, api, menu

	@Property('string')
	value: string;

	@Property('string')
	action: string; // create, read, edit, update, execute, toggle

	@Property('boolean')
	enabled: boolean;
}