import { PersistedDao } from "loopback-typescript-core/dist/models/persisted.model";
import { RoleDao as SystemRoleDao, RoleModel as SystemRoleModel } from "loopback-typescript-core/dist/models/role.model"
import { injectable, inject } from 'inversify';
import { CommonModel, Property, Relation, Hook } from "loopback-typescript-core/dist/models/decorators";
import { environment } from '../environment';
import { Role } from "../models/role.interface";
import { AccountModel } from './account.model';
import { AccessScope } from "../models";
import { RoleMappingDao } from "./role-mapping.model";
import { AccessScopeMappingDao } from "./access-scope-mapping.model";

@injectable()
export class RoleDao extends SystemRoleDao
{
	static tableName = 'iam_role'
	static modelName = 'eRole'

	ModelClass = RoleModel

	@inject('Factory<iam.Resolver>') iamResolver: (ctxClass) => any

	@Hook('after delete')
	async cleanup(ctx) {
		let roleMappingDao = this.iamResolver(RoleMappingDao)
		let scopeMappingDao = this.iamResolver(AccessScopeMappingDao)
		//console.log(ctx)
		if(ctx.where.id) {
			await roleMappingDao.destroyAll({ roleId: ctx.where.id })
			await scopeMappingDao.destroyAll({ roleId: ctx.where.id })
		}
	}
}

@injectable()
@CommonModel({
	name: RoleDao.modelName,
	base: 'Role',
	dao: RoleDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'roles',
		mongodb: {
			collection: RoleDao.tableName
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
export class RoleModel extends SystemRoleModel implements Role
{
	@Property('string', true)
	name: string;	

	@Property('string')
	description: string;

	@Property('boolean')
	enabled: boolean;

	@Relation('hasMany', 'Account', 'roleId', '', 'eRoleMapping')
	accounts: AccountModel[];

	@Relation('hasMany', 'AccessScopeMapping', 'roleId')
	scopes: AccessScope[];
}