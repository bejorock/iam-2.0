import { PersistedDao, PersistedModel } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable } from 'inversify';
import { CommonModel, Property, Relation, Hook } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { LoginAttempt } from '../models/login-attempt.interface';
import { AccountModel } from './account.model';
import { ClientModel } from './client.model';
import { CaptchaAttemptModel } from './captcha-attempt.model';
import { MultiFactorAuthAttemptModel } from './multi-fa-attempt.model';

@injectable()
export class LoginAttemptDao extends PersistedDao {
	static tableName = 'iam_login_attempt'
	static modelName = 'LoginAttempt'

	ModelClass = LoginAttemptModel

	@Hook('after save')
	async createElastic(ctx, instance) {
		let data = ctx.instance
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: environment.elasticHost,
		});

		try {
			await client.create({
				index: 'iam_login_attempt',
				type: 'mongo',
				id: String(data['id']),
				body: data
			});
			//console.log(`insert ${data['id']}`)
		} catch (error) {
			console.trace(error.message)
		}

		return false
	}
}

@injectable()
@CommonModel({
	name: LoginAttemptDao.modelName,
	dao: LoginAttemptDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'login_attempts',
		mongodb: {
			collection: LoginAttemptDao.tableName
		},

		mixins: {
			ObjectidType: {
				properties: ['accountId', 'clientId', 'fromId']
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
		// ini harus ditambah lebih spesifik
		{
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "$hasscope",
			"permission": "ALLOW"
		}
	]
})
export class LoginAttemptModel extends PersistedModel implements LoginAttempt {
	@Property('date')
	created: Date;

	// milliseconds
	@Property('number')
	ttl: number;

	@Property('any', true)
	accountId: any;

	@Property('any', true)
	clientId: any;

	@Property('string')
	device: string;

	@Property('string')
	userAgent: string;

	@Property('string')
	ip: string;

	@Property('string')
	source: string;

	@Property('string')
	url: string;

	@Property('string')
	status: string;

	@Property({ type: ['string'] })
	scopes: string[];

	@Property('number')
	count: number;

	@Property('boolean')
	success: boolean;

	@Property('boolean')
	blocked: boolean;

	@Property('boolean')
	relogin: boolean;

	@Property('any')
	fromId: any;

	@Relation('belongsTo', 'LoginAttempt', 'fromId')
	from: LoginAttempt;

	@Relation('belongsTo', 'Account', 'accountId')
	account: AccountModel;

	@Relation('belongsTo', 'Client', 'clientId')
	client: ClientModel;

	@Relation('hasOne', 'CaptchaAttempt')
	captcha: CaptchaAttemptModel;

	@Relation('hasOne', 'MultiFactorAuthAttempt')
	multiFa: MultiFactorAuthAttemptModel;
}