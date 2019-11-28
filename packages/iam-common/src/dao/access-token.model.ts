import { Property, CommonModel, Relation } from 'loopback-typescript-core/dist/models/decorators';
import { injectable } from 'inversify';
import { AccessTokenModel as TokenModel, AccessTokenDao as TokenDao } from 'loopback-typescript-core/dist/models/access-token.model';
import { environment } from '../environment';
import { AccessToken } from '../models/access-token.interface';
import { AccountModel } from './account.model';
import { ClientModel } from './client.model';

@injectable()
export class AccessTokenDao extends TokenDao
{
	static tableName = 'iam_access_token'
	static modelName = 'eAccessToken'
	
	ModelClass = AccessTokenModel

	/* resolve(id, cb?):Promise<any> {
		console.log(id)

		return super.resolve(id, cb)
	} */
}

@injectable()
@CommonModel({
	name: AccessTokenDao.modelName,
	base: 'AccessToken',
	dao: AccessTokenDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'access_tokens',
		mongodb: {
			collection: AccessTokenDao.tableName
		},

		mixins: {
			ObjectidType: {
				properties: ["userId", "clientId"]
			}
		}
	},
	publish: true,
	acls: [
		{
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "ssoadmin",
			"permission": "ALLOW"
		},
		{
			"accessType": "READ",
			"property": "exists",
			"principalType": "ROLE",
			"principalId": "$everyone",
			"permission": "ALLOW"
		}
	]
})
export class AccessTokenModel extends TokenModel implements AccessToken
{
	@Property('string')
	id: string

	@Property('number')
	ttl: number;
	
	@Property({type: ['string']})
	scopes: string[];

	@Property('date')
	created: Date;

	@Property('any', true)
	userId: any;

	@Property('any')
	clientId: any;

	@Property('string')
	device: string;

	@Property('string')
	userAgent: string;

	@Property('string')
	ip: string;

	@Property('string')
	refreshToken: string;

	@Property('string')
	source: string;

	@Property('string')
	flag1: string;

	@Property('string')
	flag2: string;

	@Property('any')
	settings: any;

	@Property('number')
	expired: number;

	@Property('boolean')
	deleted: boolean;

	@Relation('belongsTo', 'Account', 'userId')
	user: AccountModel;

	@Relation('belongsTo', 'Client', 'clientId')
	client: ClientModel;
}