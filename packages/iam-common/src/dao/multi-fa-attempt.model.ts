import { PersistedDao, PersistedModel } from 'loopback-typescript-core/dist/models/persisted.model';
import { injectable } from 'inversify';
import { CommonModel, Property, Relation, Hook } from 'loopback-typescript-core/dist/models/decorators';
import { environment } from '../environment';
import { MultiFactorAuthAttempt } from '../models/multi-fa-attempt.interface';
import { LoginAttemptModel } from './login-attempt.model';

@injectable()
export class MultiFactorAuthAttemptDao extends PersistedDao
{
	static tableName = 'iam_multi_fa_attempt'
	static modelName = 'MultiFactorAuthAttempt'

	ModelClass = MultiFactorAuthAttemptModel

	@Hook('after save')
	async createElastic(ctx, instance) {
		let data = ctx.instance
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: environment.elasticHost,
		});

		try {
			await client.create({
				index: 'iam_multi_fa_attempt',
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
	name: MultiFactorAuthAttemptDao.modelName,
	dao: MultiFactorAuthAttemptDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'multi_fa_attempts',
		mongodb: {
			collection: MultiFactorAuthAttemptDao.tableName
		},

		mixins: {
			ObjectidType: {
				properties: ['loginAttemptId']
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
export class MultiFactorAuthAttemptModel extends PersistedModel implements MultiFactorAuthAttempt
{
	@Property('any', true)
	loginAttemptId: any;	

	@Property('string', true)
	code: string;

	@Property('string', true)
	submittedCode: string;

	@Property('date')
	created: Date;

	@Property('number')
	ttl: number;

	@Property('boolean')
	success: boolean;

	@Property('boolean')
	blocked: boolean;

	@Relation('belongsTo', 'LoginAttempt', 'loginAttemptId')
	loginAttempt: LoginAttemptModel;
}