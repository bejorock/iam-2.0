import { UserDao, UserModel } from 'loopback-typescript-core/dist/models/user.model'
import { CommonModel, Property, Relation, Hidden, Remote, AfterRemote, Hook } from 'loopback-typescript-core/dist/models/decorators';
import { injectable, inject } from 'inversify';
import { environment } from '../environment';
import { PasswordStashDao, PasswordStashModel } from './password-stash.model';
import { AccountEmployementDao, AccountEmployementModel } from './account-employement.model';
import { hideProperty, BaseModel } from 'loopback-typescript-core/dist/models/base.model';
import { AccountLinkModel } from './account-link.model';
import { AccountEmailModel, AccountEmailDao } from './account-email.model';
import { AccountPhoneModel, AccountPhoneDao } from './account-phone.model';
import { AccountMessengerModel, AccountMessengerDao } from './account-messenger.model';
import { AccountAddressModel, AccountAddressDao } from './account-address.model';
import { AccessTokenModel } from './access-token.model';
import { AccountCredentialModel, AccountCredentialDao } from './account-credential.model';
import { Account } from '../models/account.interface';
import { Util } from '../util/util';
import * as _ from 'lodash';
import { RoleMappingModel, RoleMappingDao } from './role-mapping.model';
import { GroupMappingDao, GroupMappingModel } from './group-mapping.model';
import { PasswordError } from '../util';
import { DirectoryEntryDao } from './directory-entry.model';
import { from } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SettingsDao, SettingsModel } from './settings.model'
import { CounterDao } from './counter.model';
import { ClientDao } from './client.model';
import { PolicyDao } from './policy.model';
import { ScopeMappingDao } from './scope-mapping.model';
import { ReactiveApp } from 'loopback-typescript-core';

export interface AccountWithDepsParams {
	account: any,
	addresses: any[],
	emails: any[],
	phones: any[],
	messengers: any[],
	employement: any
}

@injectable()
export class AccountDao extends UserDao {
	static tableName = "iam_account"
	static modelName = 'Account'

	ModelClass = AccountModel

	@inject('Factory<iam.Resolver>')
	iamResolver: (ctxClass) => any

	//@inject(DirectoryEntryDao)
	//directoryEntryDao:DirectoryEntryDao
	//get directoryEntryDao() { return this.iamResolver(PasswordStashDao); }

	daoInitiated = false

	stashDao: PasswordStashDao
	emailDao: AccountEmailDao
	phoneDao: AccountPhoneDao
	messengerDao: AccountMessengerDao
	addressDao: AccountAddressDao
	employementDao: AccountEmployementDao
	settingsDao: SettingsDao

	//@postConstruct()
	postConstruct() {
		this.stashDao = this.iamResolver(PasswordStashDao)
		this.emailDao = this.iamResolver(AccountEmailDao)
		this.phoneDao = this.iamResolver(AccountPhoneDao)
		this.messengerDao = this.iamResolver(AccountMessengerDao)
		this.addressDao = this.iamResolver(AccountAddressDao)
		this.employementDao = this.iamResolver(AccountEmployementDao)
		this.settingsDao = this.iamResolver(SettingsDao)

		this.daoInitiated = true
	}

	@Hook('before delete')
	async safeDelete(ctx) {
		let clientDao = this.iamResolver(ClientDao)

		if(ctx.where.id) {
			let countClients = await clientDao.count({ accountId: ctx.where.id })

			if(countClients > 0)
				throw new Error('unable to delete bound entity')
		}
	}

	@Hook('after delete')
	async cleanup(ctx) {
		let directoryEntryDao = this.iamResolver(DirectoryEntryDao)
		let stashDao = this.iamResolver(PasswordStashDao)
		let emailDao = this.iamResolver(AccountEmailDao)
		let phoneDao = this.iamResolver(AccountPhoneDao)
		let messengerDao = this.iamResolver(AccountMessengerDao)
		let addressDao = this.iamResolver(AccountAddressDao)
		let groupMappingDao = this.iamResolver(GroupMappingDao)
		let roleMappingDao = this.iamResolver(RoleMappingDao)
		let credentialDao = this.iamResolver(AccountCredentialDao)
		
		//console.log(ctx)
		if(ctx.where.id) {
			await directoryEntryDao.destroyAll({ objectid: ctx.where.id })
			await stashDao.destroyAll({ accountId: ctx.where.id })
			await emailDao.destroyAll({ accountId: ctx.where.id })
			await phoneDao.destroyAll({ accountId: ctx.where.id })
			await messengerDao.destroyAll({ accountId: ctx.where.id })
			await addressDao.destroyAll({ accountId: ctx.where.id })
			await groupMappingDao.destroyAll({ accountId: ctx.where.id })
			await roleMappingDao.destroyAll({ principalId: ctx.where.id })
			await credentialDao.destroyAll({ accountId: ctx.where.id })
		}
	}

	@Hook('before save')
	async modifyCase(ctx, instance) {
		let user = ctx.instance || ctx.result || ctx.data || instance
		//console.log(user)
		if(user.username)
			user.username = user.username.toLowerCase()
		if(user.email)
			user.email = user.email.toLowerCase()
	}

	@Hook('after save')
	async createDirEntry(ctx, instance) {
		let directoryEntryDao = this.iamResolver(DirectoryEntryDao)
		let counterDao = this.iamResolver(CounterDao)
		
		let user = ctx.instance || ctx.result || ctx.data || instance
		if(!user.username)
			return false

		let dir = {
			cn: user.username.toLowerCase(),
			uid: user.username.toLowerCase(),
			givenname: user.firstName,
			sn: user.lastName,
			mail: user.email ? user.email.toLowerCase() : undefined,
			employeenumber: user.nip,
			//objectclass: ['person'],
			objectclass: ['person', 'inetorgperson', 'top', 'account', 'posixaccount', 'shadowaccount'],
			loginShell: '/bin/bash',
			homeDirectory: `/home/${user.username.toLowerCase()}`,
			objectid: user.id,
			entryuuid: user.id,
		}

		//try {
		let where:any = { uid: user.username.toLowerCase() }
		if(user.id)
			where = { or: [{ uid: user.username.toLowerCase() }, { objectid: user.id }] }
		let de = await directoryEntryDao.upsertWithWhere(where, dir)
		//console.log(de)
		if(!de.uidnumber) {
			//let counter = await counterDao.findOne({ where: { id: 'user' } })
			//await de.updateAttribute('uidnumber', counter.sequence_value)

			let counter:any = await new Promise((resolve, reject) => {
				this.ctx.getParentContext().dataSources.defaultDb.connector.collection('Counter').findOneAndUpdate(
					{ _id: 'user' },
					{ $inc: {sequence_value: 1 } },
					{ returnOriginal: false },
					function(err, instance) {
						if(err) return reject(err)

						resolve(instance.value)
					}
				)
			})

			await directoryEntryDao.updateAll({ id: de.id }, { uidnumber: counter.sequence_value })
		}
		//} catch(e) { console.log(e) }
		
		//return false
	}

	/* deleteById<T extends BaseModel>(id, options?, cb?):Promise<T> {
		console.log('delete by id')
		let directoryEntryDao = this.iamResolver(DirectoryEntryDao)
		let obs = from(super.destroyById(id, options)).pipe(
			tap(() => directoryEntryDao.destroyAll({objectid:id}) )
		)

		if(cb)
			obs.subscribe(val => cb(null, val))
		else
			return obs.toPromise()
	} */

	@Remote({
		accepts: [
			{ arg: 'params', type: 'object', http: { source: 'body' } }
		],
		returns: [{ type: 'any', root: true }],
		http: { path: '/createCascade', verb: 'post' }
	})
	async createCascade(params: AccountWithDepsParams, next) {
		if (!this.daoInitiated)
			this.postConstruct()

		//console.log(params)
		if (params.account.password !== params.account.passwordConfirmation)
			throw new Error('password not match')

		delete params.account['passwordConfirmation']

		let now = new Date()
		let ttl = 30 * 24 * 60 * 60 * 1000

		// create account
		let stash, emails, phones, messengers, addresses, employement;
		let account: AccountModel = (await this.create<AccountModel>(Object.assign({}, params.account, _.pickBy({ email: params.emails[0].email, verified: true, enabled: true, nip: params.account.nip }, _.identity))))[0]
		try {
			await this.stashDao.create({
				password: Util.encrypt(params.account.password),
				accountId: account.id,
				created: now,
				ttl: ttl,
				temporary: false
			})[0]

			await this.emailDao.create(params.emails.map(email => Object.assign({}, email, { accountId: account.id, verified: true, created: now, ttl: 0, enabled: true })))

			if (params.phones.length > 0)
				await this.phoneDao.create(params.phones.map(phone => Object.assign({}, phone, { accountId: account.id, verified: true, created: now, ttl: 0 })))

			if (params.messengers.length > 0)
				await this.messengerDao.create(params.messengers.map(messenger => Object.assign({}, messenger, { accountId: account.id, verified: true, created: now, ttl: 0, enabled: true })))

			if (params.addresses.length > 0)
				await this.addressDao.create(params.addresses.map(address => Object.assign({}, address, { accountId: account.id, verified: true, created: now, ttl: 0, enabled: true })))

			/* if (!_.isEmpty(params.employement))
				await this.employementDao.create(Object.assign({}, params.employement, { accountId: account.id, verified: true, created: now, ttl: 0, enabled: true })) */
		} catch (e) {
			this.destroyById(account.id).catch(e => log.error(e))

			let log = this.ctx.getParentContext().log

			if (stash)
				this.stashDao.destroyAll({ accountId: account.id }).catch(e => log.error(e))

			if (emails)
				this.emailDao.destroyAll({ accountId: account.id }).catch(e => log.error(e))

			if (phones)
				this.phoneDao.destroyAll({ accountId: account.id }).catch(e => log.error(e))

			if (messengers)
				this.messengerDao.destroyAll({ accountId: account.id }).catch(e => log.error(e))

			if (addresses)
				this.addressDao.destroyAll({ accountId: account.id }).catch(e => log.error(e))

			throw e
		}

		return account
		//next(null, account)
	}
}

@injectable()
@CommonModel({
	name: AccountDao.modelName,
	base: 'User',
	dao: AccountDao,
	dataSource: environment.defaultDb,
	settings: {
		plural: 'accounts',
		mongodb: {
			collection: AccountDao.tableName
		},

		mixins: {
			TimeStamp: true
		}
	},
	acls: [
		{
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "ssoadmin",
			"permission": "ALLOW"
		},
		{
			"accessType": "*",
			"property": 'checkPassword',
			"principalType": "ROLE",
			"principalId": "$everyone",
			"permission": "DENY"
		},
		{
			"accessType": "*",
			"property": 'checkPassword',
			"principalType": "ROLE",
			"principalId": "$owner",
			"permission": "ALLOW"
		},
		{
			"accessType": "*",
			"property": 'checkPassword',
			"principalType": "ROLE",
			"principalId": "$accountowner",
			"permission": "ALLOW"
		},
		{
			"accessType": "EXECUTE",
			"property": "getAuthorizedApps",
			"principalType": "ROLE",
			"principalId": "$authenticated",
			"permission": "ALLOW"
		},
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
export class AccountModel extends UserModel implements Account {
	// readonly passPattern = new RegExp('(?=^.{6,255}$)((?=.*\d)(?=.*[A-Z])(?=.*[a-z])|(?=.*\d)(?=.*[^A-Za-z0-9])(?=.*[a-z])|(?=.*[^A-Za-z0-9])(?=.*[A-Z])(?=.*[a-z])|(?=.*\d)(?=.*[A-Z])(?=.*[^A-Za-z0-9]))^.*')
	readonly passPattern = new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$')

	password: string

	@inject('Factory<iam.Resolver>')
	iamResolver: (ctxClass) => any

	@inject(ReactiveApp)
	app:ReactiveApp

	@inject(AccountDao)
	accountDao: AccountDao

	@inject(PasswordStashDao)
	stashDao: PasswordStashDao

	@inject(AccountEmployementDao)
	employementDao: AccountEmployementDao

	@inject(AccountEmailDao)
	emailDao: AccountEmailDao

	@inject(AccountPhoneDao)
	phoneDao: AccountPhoneDao

	@inject(AccountMessengerDao)
	messengerDao: AccountMessengerDao

	@inject(AccountAddressDao)
	addressDao: AccountAddressDao

	@inject(GroupMappingDao)
	groupMappingDao: GroupMappingDao

	@inject(AccountCredentialDao)
	credentialDao: AccountCredentialDao

	@inject(DirectoryEntryDao)
	directoryEntryDao: DirectoryEntryDao

	@inject(SettingsDao)
	settingsDao: SettingsDao

	@Property('string', true)
	username: string;

	@Property({ type: 'string', required: false })
	email: string;

	@Property('string')
	firstName: string;

	@Property('string')
	lastName: string;

	@Property('string')
	gender: string;

	@Property('string')
	nip: string;

	@Property('string')
	avatarUri: string;

	@Property('boolean')
	verified: boolean;

	@Property('boolean')
	longToken: boolean;

	@Property('string')
	@Hidden
	verificationToken: string;

	@Property('boolean')
	enabled: boolean;

	@Relation('hasMany', 'PasswordStash')
	stash: PasswordStashModel[];

	@Relation('hasMany', 'AccountLink')
	links: AccountLinkModel[];

	@Relation('hasMany', 'AccountEmail')
	emails: AccountEmailModel[];

	@Relation('hasMany', 'AccountPhone')
	phones: AccountPhoneModel[];

	@Relation('hasMany', 'AccountMessenger')
	messengers: AccountMessengerModel[];

	@Relation('hasMany', 'AccountAddress')
	addresses: AccountAddressModel[];

	//@Relation('hasMany', 'AccountEmployement')
	//employements: AccountEmployementModel[];

	@Relation('hasMany', 'eAccessToken')
	tokens: AccessTokenModel[];

	@Relation('hasOne', 'AccountCredential', 'accountId')
	credential: AccountCredentialModel;

	/*@Relation('hasMany', 'eRole', 'principalId', '', 'eRoleMapping', 'principalId')
	roles: RoleModel[];*/

	@Relation('hasMany', 'eRoleMapping', 'principalId')
	roles: RoleMappingModel[];

	@Relation('hasMany', 'GroupMapping', 'accountId')
	groups: GroupMappingModel[];

	async isPasswordActive(password: any) {
		//console.log(`${this.id} : ${Util.encrypt(password)}`)
		let stashs = await this.stashDao.find<PasswordStashModel>({ where: { accountId: this.id, password: Util.encrypt(password) } })
		//console.log(stashs)
		if (stashs.length == 0) return false

		for (let i = 0; i < stashs.length; i++) {
			let entry = stashs[i]

			if (entry.ttl == 0) return true
			else if ((entry.created.getTime() + entry.ttl) > Date.now()) return true
		}

		return false
	}

	async isActiveEmployee() {
		if (!this.nip) return false

		let employement = await this.employementDao.findOne<AccountEmployementModel>({ where: { nip: this.nip } })

		if (!employement)
			return false

		return true

		/*let employements = await this.employementDao.find<AccountEmployementModel>({where: {accountId: this.id}})
		
		if(employements.length == 0) return false

		for(let i=0; i<employements.length; i++) {
			let entry = employements[i]

			if(entry.ttl == 0) return true
			else if((entry.created.getTime() + entry.ttl) > Date.now()) return true
		}

		return false*/
	}

	@Remote({
		accepts: [],
		returns: [{ type: 'any', root: true }]
	})
	async deleteCascade(next) {
		await this.stashDao.destroyAll({ accountId: this.id })
		await this.emailDao.destroyAll({ accountId: this.id })
		await this.phoneDao.destroyAll({ accountId: this.id })
		await this.groupMappingDao.destroyAll({ accountId: this.id })
		await this.messengerDao.destroyAll({ accountId: this.id })
		await this.addressDao.destroyAll({ accountId: this.id })
		await this.credentialDao.destroyAll({ accountId: this.id })

		await this.accountDao.destroyById(this.id)

		return { id: this.id }
	}

	/*@Remote({
		accepts: [],
		http: {verb: "delete"},
		returns: [{type: 'any', root: true}]
	})
	async deleteGroups(next) {
		await this.groupMappingDao.destroyAll({accountId: this.id})

		return {}
	}*/

	configure() {
		super.configure()

		hideProperty(this, 'password')
		hideProperty(this, 'accountDao')
		hideProperty(this, 'stashDao')
		hideProperty(this, 'employementDao')
		hideProperty(this, 'directoryEntryDao')
	}

	static validatePassword(plain) {

	}

	@Remote(
		{
			accepts: [
				{ arg: 'password', type: 'string' }
			],
			http: { path: '/checkPassword', verb: 'post' },
			returns: [{ type: 'any', root: true }]
		}
	)
	async checkPassword(password: string, next) {
		let status = await this.hasPassword(password)
		return status
	}

	@Remote(
		{
			accepts: [
				{ arg: 'password', type: 'string' }
			],
			http: { verb: 'post' },
			returns: [{ type: 'any', root: true }]
		}
	)
	async patchPassword(password) {

		let settings: SettingsModel = await this.settingsDao.findOne({})
		//jika regex true di db, gunanakan format regex di db,jika tidak gunakan default
		if (settings.modifiedRegex) {
			if (!RegExp(settings.regex).test(password))
				throw new PasswordError(PasswordError.INVALID_PATTERN)
		} else {
			if (!this.passPattern.test(password))
				throw new PasswordError(PasswordError.INVALID_PATTERN)
		}

		let credential:any = await this.credentialDao.findOne({ where: { accountId: this.id } })
		// console.log(!!credential)
		// console.log(credential)
		if(!credential) {
			let encryptedPass = Util.encrypt(decodeURIComponent(password));
			let usedPasswords = await this.stashDao.find<PasswordStashModel>(
				{
					where: { accountId: this.id },
					order: 'created DESC',
					limit: 10
				}
			)

			for (let i = 0; i < usedPasswords.length; i++)
				if (usedPasswords[i].password === encryptedPass)
					throw new PasswordError(PasswordError.PASSWORD_USED)

			//await this.accountDao.updateAll({id: this.id}, {password: password})
			await this.accountDao.setPassword(this.id, password, {})
			await this.stashDao.create({ password: encryptedPass, accountId: this.id, ttl: 155520000000 })
		} else {
			// console.log('cvcvcvc')
			const repoService = this.app.getDataSource('repoService')

			await new Promise((resolve, reject) => {
				repoService.changePassword(credential.repositoryId, credential.uid, password, (err, data, ctx) => {
					if(err)
						return reject(err)
					
					// console.log(data)
					resolve(data)
				})
			})
		}

		return {}
	}

	patchAttributes(delta, options, cb) {
		this.accountDao.updateAll({ id: this.id }, delta, options, cb)
	}

	@Remote(
		{
			accepts: [
				{arg: 'req', type: 'object', 'http': {source: 'req'}},
 				{arg: 'res', type: 'object', 'http': {source: 'res'}}
			],
			http: { verb: 'get' },
			returns: [{ type: 'any', root: true }]
		}
	)
  async getAuthorizedApps(req, res) {
		this.ctx

		let clientDao = this.iamResolver(ClientDao)
		let policyDao = this.iamResolver(PolicyDao)
		let scopeMappingDao = this.iamResolver(ScopeMappingDao)

    let account = await this.accountDao.findOne({ where: { id: this.id } })
    let clients = await clientDao.find({ include: 'policies' })
    //clients.forEach((client:any) => console.log(client.policies))
    //console.log(account)
    let authorizedClients = []

    for(let i=0; i<clients.length; i++) {
      let client = clients[i] as any
      let policies = (await policyDao.find({ where: { clientId: client.id } })) || []

      for(let j=0; j<policies.length; j++) {
        let policy = policies[j] as any
        let scopes = await scopeMappingDao.find({where:{policyId: policy.id}, include: 'scope'})

        //console.log(scopes)
        policy.scopes = scopes as any[]
      }
      //console.log(policies)

      client.policies = function() { return policies }

			let evaluatePolicies = require('iam-openid/dist/claims/evaluate-policies.openid').evaluatePolicies
      let result = evaluatePolicies(client, account) as any

      //console.log(result)
      if(result.labels.length > 0) {
        authorizedClients.push({
          id: client.id,
          name: client.name,
          clientId: client.clientId,
          url: client.url,
          applicationType: client.applicationType
        })
      }
    }

    res.send(authorizedClients)
  }
}