import { injectable } from 'inversify';
import { PersistedDao } from 'loopback-typescript-core/dist/models/persisted.model';
import { BaseModel } from 'loopback-typescript-core/dist/models/base.model';

export function composeExpiredFilter(filter) {
	filter.where = filter.where || {}
	let where = filter.where
	let withExpired = filter.withExpired

	delete where['withExpired']

	if(withExpired)
		return;

	//Object.assign(where, {expired: {between: [1, Date.now()]}})
	filter.where = Object.assign({}, {and: [where, {or: [{expired: 0}, {expired: {gt: Date.now()}}]}]})
	//console.log(JSON.stringify(filter.where))
}

@injectable()
export abstract class TimeDao extends PersistedDao
{
	find<T extends BaseModel>(filter, options?, cb?):Promise<Array<T>> {
		composeExpiredFilter(filter)

		return super.find(filter, options, cb)
	}

	findById<T extends BaseModel>(id, filter, options?, cb?):Promise<T> {
		composeExpiredFilter(filter)

		return super.findById(id, filter, options, cb)
	}

	findOne<T extends BaseModel>(filter, options?, cb?):Promise<T> {
		composeExpiredFilter(filter)

		return super.findOne(filter, options, cb)
	}
}