import { PersistedModel, PersistedDao } from 'loopback-typescript-core/dist/models/persisted.model';
import { Property, CommonModel } from 'loopback-typescript-core/dist/models/decorators';
import { injectable } from 'inversify';
import { environment } from '../environment';
import { DirectoryEntry } from '../models/directory-entry.interface';

@injectable()
export class DirectoryEntryDao extends PersistedDao
{
	static tableName = 'iam_directory_entry'
	static modelName = 'DirectoryEntry'

	ModelClass = DirectoryEntryModel
}

@injectable()
@CommonModel({
	name: DirectoryEntryDao.modelName,
	dao: DirectoryEntryDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'directory_entries',
		mongodb: {
			collection: DirectoryEntryDao.tableName
		},

		mixins: {
			ObjectidType: {
				properties: ["principalId"]
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
export class DirectoryEntryModel extends PersistedModel
{
	// user.username / group.name
	@Property('string', true)
	cn: string;

	//@Property('any')
	//dn: string;

	// user.username / group.name
	@Property('string', true)
	uid: string;

	//@Property('string')
	//sAMAccountName: string;

	// group.name
	@Property('string')
	name: string;

	// user.firstname
	@Property('string')
	givenname: string;

	// user.lastname
	@Property('string')
	sn: string;

	// user.email
	@Property('string')
	mail: string;

	// user.phone
	//@Property('string')
	//telephonenumber: string;

	// user.nip
	@Property('string')
	employeenumber: string;

	// user = person, group = group
	@Property({type: ['string']})
	objectclass: string[];
	
	// user = account.id, group = group.id
	@Property('any')
	objectid: any;

	// user.id / group.id
	@Property('string')
	entryuuid: string;

	get<T extends any>(key: string): T {
		throw new Error("Method not implemented.");
	}	
}