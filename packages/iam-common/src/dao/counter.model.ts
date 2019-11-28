import { PersistedModel, PersistedDao } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable } from 'inversify';
import { CommonModel, Property, Relation } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { Directory } from '../models/directory.interface';
import { DirectoryEntryModel } from './directory-entry.model';

@injectable()
export class CounterDao extends PersistedDao
{
	static tableName = 'iam_counter'
	static modelName = 'Counter'

	ModelClass = CounterModel
}

@injectable()
@CommonModel({
	name: CounterDao.modelName,
	dao: CounterDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'counters',
		mongodb: {
			collection: CounterDao.tableName
		},

		mixins: {}
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
		// ini harus ditambah lebih spesifik
		{
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "$hasscope",
			"permission": "ALLOW"
		}
	]
})
export class CounterModel extends PersistedModel
{
	@Property('number', true)
	sequence_value: number;
}