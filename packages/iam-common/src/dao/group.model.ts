import { PersistedDao, PersistedModel } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable, inject } from "inversify";
import { CommonModel, Property, Relation, Hook } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { Group } from '../models/group.interface';
import { AccountModel } from './account.model';
import { DirectoryEntryDao } from './directory-entry.model';
import { BaseModel, ReactiveApp } from 'loopback-typescript-core';
import { from } from 'rxjs';
import { tap, filter } from 'rxjs/operators';
import { CounterDao } from './counter.model';
import { GroupMappingDao } from './group-mapping.model';
import { ClientDao } from './client.model';


@injectable()
export class GroupDao extends PersistedDao
{
	static tableName = 'iam_group'
	static modelName = 'Group'

	ModelClass = GroupModel

	@inject(ReactiveApp)
	ctx:ReactiveApp
	
	@inject('Factory<iam.Resolver>') iamResolver: (ctxClass) => any

	@Hook('before delete')
	async safeDelete(ctx) {
		let clientDao = this.iamResolver(ClientDao)

		if(ctx.where.id) {
			let countClients = await clientDao.count({ groupId: ctx.where.id })

			if(countClients > 0)
				throw new Error('unable to delete bound entity')
		}
	}

	@Hook('after delete')
	async cleanup(ctx) {
		let directoryEntryDao = this.iamResolver(DirectoryEntryDao)
		let groupMappingDao = this.iamResolver(GroupMappingDao)
		//console.log(ctx)
		if(ctx.where.id) {
			await directoryEntryDao.destroyAll({ objectid: ctx.where.id })
			await groupMappingDao.destroyAll({ groupId: ctx.where.id })
		}
	}

	@Hook('after save')
	async createDirEntry(ctx, instance) {
		let directoryEntryDao = this.iamResolver(DirectoryEntryDao)
		let counterDao = this.iamResolver(CounterDao)

		let group = ctx.instance || ctx.result || ctx.data || instance
		let dir = {
			cn: group.name.toLowerCase(),
			uid: group.name.toLowerCase(),
			name: group.name.toLowerCase(),
			objectclass: ['posixgroup', 'group', 'top'],
			objectid: group.id,
			entryuuid: group.id,
		}

		let de = await directoryEntryDao.upsertWithWhere({ uid: group.name.toLowerCase() }, dir)

		if(!de.gidnumber) {
			//this.ctx.getParentContext().dataSources.defaultDb.connector.collection

			//let counter = await counterDao.findOne({ where: { id: 'group' } })
			//counter.updateAttribute()

			let counter:any = await new Promise((resolve, reject) => {
				this.ctx.getParentContext().dataSources.defaultDb.connector.collection('Counter').findOneAndUpdate(
					{ _id: 'group' },
					{ $inc: {sequence_value: 1 } },
					{ returnOriginal: false },
					function(err, instance) {
						if(err) return reject(err)

						resolve(instance.value)
					}
				)
			})
			
			//await de.updateAttribute('gidnumber', counter.sequence_value)
			await directoryEntryDao.updateAll({ id: de.id }, { gidnumber: counter.sequence_value })
		}

		//return false
	}

	/* deleteById<T extends BaseModel>(id, options?, cb?):Promise<T> {
		let directoryEntryDao = this.iamResolver(DirectoryEntryDao)
		let obs = from(super.destroyById(id, options)).pipe(
			tap(() => directoryEntryDao.destroyAll({objectid:id}) )
		)

		if(cb)
			obs.subscribe(val => cb(null, val))
		else
			return obs.toPromise()
	} */
}

@injectable()
@CommonModel({
	name: GroupDao.modelName,
	dao: GroupDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'groups',
		mongodb: {
			collection: GroupDao.tableName
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
export class GroupModel extends PersistedModel implements Group
{
	@Property('string', true)
	name: string;	

	@Property('string')
	description: string;

	@Property('boolean')
	enabled: boolean;

	@Relation('hasMany', 'Account')
	accounts: AccountModel[];
}