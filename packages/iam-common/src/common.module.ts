import { Module } from 'loopback-typescript-core';
import { CommonModule as ModuleDeclaration } from 'loopback-typescript-core/dist/models/decorators'
import { injectable, Container, interfaces } from 'inversify';
import { AccessScopeMappingModel, AccessScopeModel, AccessTokenModel, AccountAddressModel, AccountCredentialModel, AccountEmailModel, AccountEmployementModel, AccountLinkModel, AccountMessengerModel, AccountPhoneModel, AccountModel, AuthRepositoryModel, AuthServiceModel, CaptchaAttemptModel, ClientModel, DirectoryEntryModel, DirectoryModel, GroupMappingModel, GroupModel, LoginAttemptModel, MultiFactorAuthAttemptModel, PasswordStashModel, PolicyModel, RoleMappingModel, RoleModel, ScopeMappingModel, ScopeModel, SettingsModel } from './dao';
import { CounterModel } from './dao/counter.model';
import * as _ from 'lodash';

const READ_CATEGORY = ['exists', 'findbyid', 'find', 'findone', 'count']
const CREATE_CATEGORY = ['create']
const UPDATE_CATEGORY = ['updateattributes', 'upsert']
const DELETE_CATEGORY = ['destroybyid']

@injectable()
@ModuleDeclaration({
	models: [
		AccessScopeMappingModel,
		AccessScopeModel,
		AccessTokenModel,
		AccountAddressModel,
		AccountCredentialModel,
		AccountEmailModel,
		AccountEmployementModel,
		AccountLinkModel,
		AccountMessengerModel,
		AccountPhoneModel,
		AccountModel,
		AuthRepositoryModel,
		AuthServiceModel,
		CaptchaAttemptModel,
		ClientModel,
		DirectoryEntryModel,
		DirectoryModel,
		GroupMappingModel,
		GroupModel,
		LoginAttemptModel,
		MultiFactorAuthAttemptModel,
		PasswordStashModel,
		PolicyModel,
		RoleMappingModel,
		RoleModel,
		ScopeModel,
		ScopeMappingModel,
		SettingsModel,
		CounterModel
	],

	factories: [
		(container:Container) => {
			container.bind<interfaces.Factory<any>>('Factory<iam.Resolver>').toFactory((context:interfaces.Context) => {
				return (ctxClass) => {
					return container.get(ctxClass)
				}
			})
		}
	]
})
export class CommonModule extends Module
{
	loadAll(m:any) {
		super.loadAll(m)

		// configure dynamic role
		let eRole = this.ctx.getParentContext().models.eRole
		let eRoleMapping = this.ctx.getParentContext().models.eRoleMapping
		let GroupMapping = this.ctx.getParentContext().models.GroupMapping
		let AccessScope = this.ctx.getParentContext().models.AccessScope
		let AccessScopeMapping = this.ctx.getParentContext().models.AccessScopeMapping

		eRole.registerResolver('$accountowner', (role, context, cb) => {
			let userId = context.accessToken.userId;
    	if(!userId) {
      	//A: No, user is NOT logged in: callback with FALSE
      	return process.nextTick(() => cb(null, false));
			}
			
			let modelId = context.modelId
			if(!modelId) {
				return process.nextTick(() => cb(null, false));
			}

			let opts = {accessToken: context.accessToken};

			context.model.findById(modelId, {}, opts, (err, instance) => {
				if(err) return cb(err)
				else if(!instance) return cb(new Error('instance not found'))
				else if(instance.accountId === userId || instance.createdBy === userId || instance.modifiedBy === userId) return cb(null, true)
				else return cb(null, false)
			})
		})

		eRole.registerResolver('$groupmember', (role, context, cb) => {
			let userId = context.accessToken.userId;
    	if(!userId) {
      	//A: No, user is NOT logged in: callback with FALSE
      	return process.nextTick(() => cb(null, false));
			}
			
			let modelId = context.modelId
			if(!modelId) {
				return process.nextTick(() => cb(null, false));
			}

			let opts = {accessToken: context.accessToken};

			context.model.findById(modelId, {}, opts, (err, instance) => {
				if(err) return cb(err)
				else if(!instance) return cb(new Error('instance not found'))
				else if(!instance.groupId) return cb(null, false)
				else {
					GroupMapping.count({
						accountId: userId,
						groupId: instance.groupId
					}, (err, count) => {
						if(err) return cb(err)
						else if(count > 0) return cb(null, true)
						else return cb(null, false)
					})
				}
			})
		})

		eRole.registerResolver('$hasscope', (role, context, cb) => {
			let userId = context.accessToken.userId;
    	if(!userId) {
      	//A: No, user is NOT logged in: callback with FALSE
      	return process.nextTick(() => cb(null, false));
			}

			let opts = {accessToken: context.accessToken};

			let modelName = context.modelName
			let property = context.property
			let accessType = context.accessType

			let selector = `api:core:${_.snakeCase(modelName)}:${accessType.toLowerCase()}`
			let altSelector1, altSelector2
			if(READ_CATEGORY.indexOf(property.toLowerCase()) > -1)
				altSelector1 = `api:core:${_.snakeCase(modelName)}:read`
			else if(CREATE_CATEGORY.indexOf(property.toLowerCase()) > -1)
				altSelector1 = `api:core:${_.snakeCase(modelName)}:create`
			else if(UPDATE_CATEGORY.indexOf(property.toLowerCase()) > -1)
				altSelector1 = `api:core:${_.snakeCase(modelName)}:edit`
			else if(DELETE_CATEGORY.indexOf(property.toLowerCase()) > -1)
				altSelector1 = `api:core:${_.snakeCase(modelName)}:delete`

			altSelector2 = `api:core:${_.snakeCase(modelName)}:${accessType.toLowerCase()}:${property.toLowerCase()}`

			// get roles
			eRoleMapping.find({ where: { principalId: userId }, include: 'role' }, opts, (err, instances) => {
				// get scopes
				if(err) return cb(err)
				AccessScopeMapping.find({ where: { roleId: { inq: instances.map(i => i.roleId) } }, include: 'scope' }, opts, (err2, scopes) => {
					if(err2) return cb(err2)
					for(let i=0; i<scopes.length; i++) {
						let scope = scopes[i].scope
						if(scope.category === 'api' && scope.enabled && (scope.name === selector || scope.name === altSelector1 || scope.name || altSelector2)) {
							return process.nextTick(() => cb(null, true))
						}
					}

					return process.nextTick(() => cb(null, false));
				})
			})
		})

		eRole.registerResolver('$svcrepo', (role, context, cb) => {
			let headers = context.remotingContext.req.headers
			if(!headers)
				return process.nextTick(() => cb(null, false));

			let token = headers.authorization
			if(!token)
				return process.nextTick(() => cb(null, false));

			let knownToken = this.ctx.getConfig('svcToken')
			if(knownToken.repo === token)
				return process.nextTick(() => cb(null, true))

			return process.nextTick(() => cb(null, false));
		})

		eRole.registerResolver('$svcldap', (role, context, cb) => {
			let headers = context.remotingContext.req.headers
			if(!headers)
				return process.nextTick(() => cb(null, false));

			let token = headers.authorization
			if(!token)
				return process.nextTick(() => cb(null, false));

			let knownToken = this.ctx.getConfig('svcToken')
			if(knownToken.ldap === token)
				return process.nextTick(() => cb(null, true))

			return process.nextTick(() => cb(null, false));
		})

		eRole.registerResolver('$svcemail', (role, context, cb) => {
			let headers = context.remotingContext.req.headers
			if(!headers)
				return process.nextTick(() => cb(null, false));

			let token = headers.authorization
			if(!token)
				return process.nextTick(() => cb(null, false));

			let knownToken = this.ctx.getConfig('svcToken')
			if(knownToken.email === token)
				return process.nextTick(() => cb(null, true))

			return process.nextTick(() => cb(null, false));
		})

		eRole.registerResolver('$svcscheduler', (role, context, cb) => {
			let headers = context.remotingContext.req.headers
			if(!headers)
				return process.nextTick(() => cb(null, false));

			let token = headers.authorization
			if(!token)
				return process.nextTick(() => cb(null, false));

			let knownToken = this.ctx.getConfig('svcToken')
			if(knownToken.scheduler === token)
				return process.nextTick(() => cb(null, true))

			return process.nextTick(() => cb(null, false));
		})

		eRole.registerResolver('$svcsap', (role, context, cb) => {
			let headers = context.remotingContext.req.headers
			if(!headers)
				return process.nextTick(() => cb(null, false));

			let token = headers.authorization
			if(!token)
				return process.nextTick(() => cb(null, false));

			let knownToken = this.ctx.getConfig('svcToken')
			if(knownToken.sap === token)
				return process.nextTick(() => cb(null, true))

			return process.nextTick(() => cb(null, false));
		})
	}
}