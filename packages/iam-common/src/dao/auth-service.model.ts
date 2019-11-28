import { PersistedDao, PersistedModel } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable, inject } from 'inversify';
import { CommonModel, Property, Relation, Hook } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { AuthService } from '../models/auth-service.interface';
import { ClientModel, ClientDao } from './client.model';

@injectable()
export class AuthServiceDao extends PersistedDao {
	static tableName = 'iam_auth_service'
	static modelName = 'AuthService'

	ModelClass = AuthServiceModel

	@inject('Factory<iam.Resolver>') iamResolver: (ctxClass) => any

	@Hook('before delete')
	async safeDelete(ctx) {
		let clientDao = this.iamResolver(ClientDao)

		if(ctx.where.id) {
			let total = await clientDao.count({ authServiceId: ctx.where.id })

			if(total > 0)
				throw new Error('unable to delete bound entity')
		}
	}
}

@injectable()
@CommonModel({
	name: AuthServiceDao.modelName,
	dao: AuthServiceDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'auth_services',
		mongodb: {
			collection: AuthServiceDao.tableName
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
export class AuthServiceModel extends PersistedModel implements AuthService {
	@Property('string', true)
	name: string;

	@Property('string', true)
	authUrl: string;

	@Property('string', true)
	provider: string;

	@Property('any')
	settings: any;

	@Property('boolean')
	enabled: boolean

	@Relation('hasMany', 'Client')
	clients: ClientModel[];
}