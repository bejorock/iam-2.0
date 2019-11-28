import { PersistedModel, PersistedDao } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable } from 'inversify';
import { CommonModel, Property, Relation } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { Directory } from '../models/directory.interface';
import { DirectoryEntryModel } from './directory-entry.model';

@injectable()
export class DirectoryDao extends PersistedDao
{
	static tableName = 'iam_directory'
	static modelName = 'Directory'

	ModelClass = DirectoryModel
}

@injectable()
@CommonModel({
	name: DirectoryDao.modelName,
	dao: DirectoryDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'directories',
		mongodb: {
			collection: DirectoryDao.tableName
		},

		mixins: {
			ObjectidType: {
				properties: ['root', 'entryId']
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
export class DirectoryModel extends PersistedModel
{
	@Property('string', true)
	cn: string;

	@Property('string', true)
	dn: string;

	@Property('any')
	root: any;

	@Property('date')
	created: Date;

	@Property('number')
	ttl: number;

	@Property('boolean')
	enabled: boolean;

	@Property('any')
	entryId:any

	@Relation('hasOne', 'DirectoryEntry', 'entryId')
	entry: DirectoryEntryModel;

	@Relation('belongsTo', 'Directory', 'root')
	rootDirectory: DirectoryModel;
}