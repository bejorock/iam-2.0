import { PersistedDao, PersistedModel } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable } from 'inversify';
import { CommonModel, Property } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { Settings } from '../models/settings.interface';

@injectable()
export class SettingsDao extends PersistedDao {
	static tableName = 'iam_settings'
	static modelName = 'Settings'

	ModelClass = SettingsModel
}

@injectable()
@CommonModel({
	name: SettingsDao.modelName,
	dao: SettingsDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'settings',
		mongodb: {
			collection: SettingsDao.tableName
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
export class SettingsModel extends PersistedModel implements Settings {
	@Property('string')
	title: string;

	@Property('any')
	contacts: any;

	@Property('any')
	whitelist: any;

	@Property('any')
	blacklist: any;

	@Property('string')
	info: string;

	@Property('string')
	logoUri: string;

	@Property('string')
	backgroundUri: string;

	@Property('string')
	loginScreenUri: string;

	@Property('any')
	captcha: any;

	@Property('any')
	multiFa: any;

	@Property('number')
	accessTokenTtl: number

	@Property('string')
	uiBaseUri: string;

	@Property('string')
	uiLoginPath: string;

	@Property('string')
	uiMultiFaPath: string;

	@Property('string')
	uiHomePath: string;

	@Property('boolean')
	modifiedRegex: boolean;

	@Property('string')
	regex: string;

	@Property('string')
	checkPassOrigin: string;
}