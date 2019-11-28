import { PersistedDao, PersistedModel } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable, inject } from 'inversify';
import { CommonModel, Property, Relation, Hook } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { Policy } from '../models/policy.interface';
import { ClientModel } from './client.model';
import { ScopeModel } from './scope.model';
import { CounterDao } from './counter.model';
import { ScopeMappingDao } from './scope-mapping.model';

@injectable()
export class PolicyDao extends PersistedDao
{
	static tableName = 'iam_policy'
	static modelName = 'Policy'
	
	ModelClass = PolicyModel

	@inject('Factory<iam.Resolver>') iamResolver: (ctxClass) => any

	@Hook('after delete')
	async cleanup(ctx) {
		let scopeMappingDao = this.iamResolver(ScopeMappingDao)
		//console.log(ctx)
		if(ctx.where.id) {
			await scopeMappingDao.destroyAll({ policyId: ctx.where.id })
		}
	}

	@Hook('before save')
	async createDirEntry(ctx, instance) {
		let counterDao = this.iamResolver(CounterDao)

		let policy = ctx.instance || ctx.result || ctx.data || instance
		
		if(!policy.gidnumber) {
			//let counter = await counterDao.findOne({ where: { id: 'policy' } })
			let counter:any = await new Promise((resolve, reject) => {
				this.ctx.getParentContext().dataSources.defaultDb.connector.collection('Counter').findOneAndUpdate(
					{ _id: 'policy' },
					{ $inc: {sequence_value: 1 } },
					{ returnOriginal: false },
					function(err, instance) {
						if(err) return reject(err)

						resolve(instance.value)
					}
				)
			})

			policy.gidnumber = counter.sequence_value
		}

		//return false
	}
}

@injectable()
@CommonModel({
	name: PolicyDao.modelName,
	dao: PolicyDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'policies',
		mongodb: {
			collection: PolicyDao.tableName
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
export class PolicyModel extends PersistedModel implements Policy
{
	@Property('string', true)
	name: string;	

	@Property('string', true)
	role: string;

	@Property('any')
	filters: any;

	@Property('boolean')
	enabled: boolean;

	@Property('any')
	clientId: any;

	@Relation('belongsTo', 'Client', 'clientId')
	client: ClientModel;

	@Relation('hasMany', 'ScopeMapping', 'policyId')
	scopes
}