import { PersistedDao, PersistedModel } from "loopback-typescript-core/dist/models/persisted.model";
import { injectable } from "inversify";
import { CommonModel, Property, Relation, Hook } from "loopback-typescript-core/dist/models/decorators";
import { environment } from '../environment';
import { CaptchaAttempt } from "../models/captcha-attempt.interface";
import { LoginAttemptModel } from './login-attempt.model';

@injectable()
export class CaptchaAttemptDao extends PersistedDao
{
	static tableName = 'iam_captcha_attempt'
	static modelName = 'CaptchaAttempt'

	ModelClass = CaptchaAttemptModel

	@Hook('after save')
	async createElastic(ctx, instance) {
		let data = ctx.instance
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: environment.elasticHost
		});

		try {
			await client.create({
				index: 'iam_captcha_attempt',
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
	name: CaptchaAttemptDao.modelName,
	dao: CaptchaAttemptDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'captcha_attempts',
		mongodb: {
			collection: CaptchaAttemptDao.tableName
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
export class CaptchaAttemptModel extends PersistedModel implements CaptchaAttempt
{
	@Property('string')
	loginAttemptId: any;
	
	@Property('string', true)
	captcha: string;

	@Property('string', true)
	submittedCaptcha: string;

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