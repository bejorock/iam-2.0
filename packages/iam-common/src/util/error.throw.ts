export class AuthError extends Error {
	static REPOSITORY_UNREACHABLE = 0
	static USER_NOT_FOUND = 1
	static USER_HAS_DOMAIN = 2
	static INVALID_PASSWORD = 3
	static PASSWORD_EXPIRED = 4
	static NOT_VALID_EMPLOYEE = 5
	static CONFLICT_USER = 6
	static INVALID_CAPTCHA = 7
	static INVALID_DOMAIN_USER = 8;
	static INVALID_TOKEN = 9;
	static DISABLED_USER = 10

	prevId: string

	constructor(public status: number, public entity?: any, private from?: Error) {
		super()

		this.message = `auth error `
		if (this.isUserNotFound) this.message = `${this.message}, user tidak ditemukan`
		else if (this.isDomainUser) this.message = `${this.message}, membutuhkan akses ke repository domain`
		else if (this.isInvalidPassword) this.message = `${this.message}, password tidak sesuai`
		else if (this.isPasswordExpired) this.message = `${this.message}, password expired`
		else if (this.isUserNotEmployee) this.message = `${this.message}, bukan pegawai`
		else if (this.isConflict) this.message = `${this.message}, konflik username`
		else if (this.isCapcha) this.message = `${this.message}, Captcha tidak sesuai`
		else if (this.isUnreachable) this.message = `${this.message}, repository tidak dapat terhubung`
		else if (this.isInvalidDomainUser) this.message = `${this.message}, invalid, domain user`
		else if (this.isDisabledUser) this.message = `${this.message}, user is disabled`
	}

	get isUserNotFound() { return this.status == AuthError.USER_NOT_FOUND }
	get isDomainUser() { return this.status == AuthError.USER_HAS_DOMAIN }
	get isInvalidPassword() { return this.status == AuthError.INVALID_PASSWORD }
	get isPasswordExpired() { return this.status == AuthError.PASSWORD_EXPIRED }
	get isUserNotEmployee() { return this.status == AuthError.NOT_VALID_EMPLOYEE }
	get isConflict() { return this.status == AuthError.CONFLICT_USER }
	get isCapcha() { return this.status == AuthError.INVALID_CAPTCHA }
	get isUnreachable() { return this.status == AuthError.REPOSITORY_UNREACHABLE }
	get isInvalidDomainUser() { return this.status == AuthError.INVALID_DOMAIN_USER }
	get isInvalidToken() { return this.status == AuthError.INVALID_TOKEN }
	get isDisabledUser() { return this.status == AuthError.DISABLED_USER }
}

export class NoClientFoundError extends Error {
	constructor(private clientId) {
		super(`no client found for id : ${clientId}`)
	}
}

export class PasswordError extends Error {
	static readonly INVALID_PASSWORD = 0
	static readonly INVALID_PATTERN = 1
	static readonly PASSWORD_USED = 2

	constructor(status: number) {
		super()

		if (status == PasswordError.INVALID_PASSWORD) this.message = 'password tidak sesuai'
		else if (status == PasswordError.INVALID_PATTERN) this.message = 'Password tidak memenuhi kriteria'
		else if (status == PasswordError.PASSWORD_USED) this.message = 'Password yang anda masukkan sudah pernah digunakan sebelumnya'
	}
}