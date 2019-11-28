import { PersistedDao, PersistedModel } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable } from 'inversify';
import { CommonModel, Property, Relation } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { ScopeMapping } from '../models/scope-mapping.interface';
import { PolicyModel } from './policy.model';
import { ScopeModel } from './scope.model';
import { BaseModel } from 'loopback-typescript-core';
import { from } from 'rxjs';
import { switchMap, tap, toArray, filter } from 'rxjs/operators';

@injectable()
export class ScopeMappingDao extends PersistedDao
{
	static tableName = 'iam_scope_mapping'
	static modelName = 'ScopeMapping'

	ModelClass = ScopeMappingModel

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
	name: ScopeMappingDao.modelName,
	dao: ScopeMappingDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'scope_mappings',
		mongodb: {
			collection: ScopeMappingDao.tableName
		},

		mixins: {
			ObjectidType: {
				properties: ['policyId', 'scopeId']
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
export class ScopeMappingModel extends PersistedModel implements ScopeMapping
{
	@Property('any', true)
	policyId: any;
	
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

	@Relation('belongsTo', 'Policy', 'policyId')
	policy

	@Relation('belongsTo', 'Scope', 'scopeId')
	scope
}