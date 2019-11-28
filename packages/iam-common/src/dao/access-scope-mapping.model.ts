import { PersistedDao, PersistedModel } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable } from "inversify";
import { CommonModel, Property, Relation, Remote } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { AccessScopeMapping } from '../models/access-scope-mapping.interface';
import { Role } from '../models/role.interface';
import { AccessScopeModel } from './access-scope.model';
import { TimeDao } from './time.model';
import { BaseModel } from 'loopback-typescript-core';
import { from } from 'rxjs';
import { switchMap, tap, filter, toArray, mergeMap } from 'rxjs/operators';

@injectable()
export class AccessScopeMappingDao extends PersistedDao
{
	static tableName = 'iam_access_scope_mapping'
	static modelName = 'AccessScopeMapping'

	ModelClass = AccessScopeMappingModel

	@Remote({
		accepts: [
			{ arg: 'entries', type: 'array', http: { source: 'body' } }
		],
		returns: [{type: 'any', root: true}],
		http: { path: '/upsertMany', verb: 'post' }
	})
	async upsertMany(entries:any[], next) {
		for(let i=0; i<entries.length; i++) {
			entries[i] = (await this.upsert(entries[i]))
		}

		return entries
	}

	find<T extends BaseModel>(qFilter, options?, cb?):Promise<Array<T>> {
		if(typeof options === 'function') {
			cb = options
			options = undefined
		}

		let obs = from(super.find(qFilter, options)).pipe(
			switchMap(data => from(data as any[])),
			tap(val => {
				if(val.expired > 0 && val.expired < Date.now())
					this.destroyById(val.id)
				
			}),
			filter(val => val.expired > Date.now() || val.expired == 0),
			filter(val => (!val.scope ? true : val.scope.enabled)),
			toArray()
		)

		if(cb)
			obs.subscribe(data => cb(null, data))
		else
			return obs.toPromise() as Promise<any>
	}

	findById<T extends BaseModel>(id, qFilter, options?, cb?):Promise<T> {
		if(typeof options === 'function') {
			cb = options
			options = undefined
		}

		let obs = from(super.findById<any>(id, qFilter, options)).pipe(
			tap(val => {
				if(val.expired > 0 && val.expired < Date.now())
					this.destroyById(val.id)
			}),
			filter(val => val.expired > Date.now() || val.expired == 0),
			filter(val => (!val.scope ? true : val.scope.enabled))
		)

		if(cb)
			obs.subscribe(val => cb(null, val))
		else
			return obs.toPromise()
	}

	findOne<T extends BaseModel>(qFilter, options?, cb?):Promise<T> {
		if(typeof options === 'function') {
			cb = options
			options = undefined
		}

		let obs = from(super.findOne<any>(qFilter, options)).pipe(
			tap(val => {
				if(val.expired > 0 && val.expired < Date.now())
					this.destroyById(val.id)
			}),
			filter(val => val.expired > Date.now() || val.expired == 0),
			filter(val => (!val.scope ? true : val.scope.enabled))
		)

		if(cb)
			obs.subscribe(val => cb(null, val))
		else
			return obs.toPromise()
	}
}

@injectable()
@CommonModel({
	name: AccessScopeMappingDao.modelName,
	dao: AccessScopeMappingDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'access_scope_mappings',
		mongodb: {
			collection: AccessScopeMappingDao.tableName
		},

		mixins: {
			ObjectidType: {
				properties: ["roleId", "scopeId"]
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
			"principalId": "$hasscope",
			"permission": "ALLOW"
		}
	]
})
export class AccessScopeMappingModel extends PersistedModel implements AccessScopeMapping
{
	@Property('any', true)
	roleId: any;	

	@Property('any', true)
	scopeId: any;

	// deprecated
	@Property('date')
	created: Date;

	// deprecated
	@Property('number')
	ttl: number;

	@Property('number')
	timestamp: number;

	@Property('number')
	modified: number;

	@Property('number')
	expired: number;

	@Relation('belongsTo', 'eRole', 'roleId')
	role: Role;

	@Relation('belongsTo', 'AccessScope', 'scopeId')
	scope: AccessScopeModel;
}