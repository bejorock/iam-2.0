import { PersistedDao, PersistedModel } from "loopback-typescript-core/dist/models/persisted.model";
import { injectable } from "inversify";
import { CommonModel, Property, Relation } from "loopback-typescript-core/dist/models/decorators";
import { environment } from '../environment';
import { AccountEmployement } from "../models/account-employment.interface";
import { AccountModel } from './account.model';

@injectable()
export class AccountEmployementDao extends PersistedDao
{
	static tableName = 'iam_account_employement'
	static modelName = 'AccountEmployement'

	ModelClass = AccountEmployementModel
}

@injectable()
@CommonModel({
	name: AccountEmployementDao.modelName,
	dao: AccountEmployementDao,
	dataSource: environment.sapDb,
	settings: {
		plural: 'account_employements',
		mixins: {}
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
export class AccountEmployementModel extends PersistedModel implements AccountEmployement
{
	@Property('string', true)
	nip: string;	

	// pernr
	@Property('number', true)
	pernr: number;

	@Property('string')
	registeredName: string;

	@Property('any')
	posisi: any;

	@Property('any')
	organisasi: any;

	@Property('any')
	personnelArea: any;

	@Property('any')
	personnelSubArea: any;

	@Property('any')
	businessArea: any;

	@Property('any')
	companyCode: any;

	@Property('any')
	jenisJabatan: any;

	@Property('any')
	jenjangJabatan: any;

	@Property('string')
	grade: string;

	@Property('any')
	officer: any;

	//@Property('any', true)
	//accountId: any;

	// deprecated
	//@Property('date')
	//created: Date;

	// deprecated
	//@Property('number')
	//ttl: number;

	//@Property('number')
	//timestamp: number;

	//@Property('number')
	//modified: number;

	//@Property('number')
	//expired: number;

	//@Property('boolean')
	//enabled: boolean;

	//@Relation('belongsTo', 'Account', 'accountId')
	//account: AccountModel;

	//@Relation('belongsTo', 'AccountEmployement', 'directOfficerId')
	//directOfficer: AccountEmployementModel;
}
