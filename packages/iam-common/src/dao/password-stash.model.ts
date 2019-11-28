import { PersistedModel, PersistedDao } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable } from 'inversify';
import { CommonModel, Property, Relation } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { PasswordStash } from '../models/password-stash.interface';
import { AccountModel } from './account.model';

@injectable()
export class PasswordStashDao extends PersistedDao
{
	static tableName = 'iam_password_stash'
	static modelName = 'PasswordStash'

	ModelClass = PasswordStashModel
}

@injectable()
@CommonModel({
	name: PasswordStashDao.modelName,
	dao: PasswordStashDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'password_stashs',
		mongodb: {
			collection: PasswordStashDao.tableName
		},

		mixins: {
			ObjectidType: {
				properties: ['accountId']
			},
			TimeStamp: true
		}
	},
	publish: false
})
export class PasswordStashModel extends PersistedModel implements PasswordStash
{
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

	@Property('boolean')
	temporary: boolean;

	@Property('string', true)
	password: string;

	@Property('any', true)
	accountId: any;

	@Relation('belongsTo', 'Account', 'accountId')
	account:AccountModel

	isExpired(): boolean {
		throw new Error("Method not implemented.");
	}
}