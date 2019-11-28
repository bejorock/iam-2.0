import * as Bunyan from 'bunyan';
import { Writable } from 'stream';
import dateFormat from 'dateformat';
import colors from 'colors/safe';
import jwtDecode from 'jwt-decode';
import bcrypt = require('bcrypt-nodejs');
import base64 = require('base-64');

//const dateFormat = formatter.default
const consoleOut = new Writable({objectMode: true})
consoleOut._write = (chunk, enc, next) => {
	let obj = JSON.parse(chunk.toString())
	
	if(obj.level == 50 || obj.level == 60)
		console.log(colors.red(`[${dateFormat(new Date(obj.time), 'dd-mm-yy HH:MM:ss')}] ERROR: ${obj.name}: ${obj.msg}`))
	else if(obj.level == 20)
		console.log(colors.cyan(`[${dateFormat(new Date(obj.time), 'dd-mm-yy HH:MM:ss')}] DEBUG: ${obj.name}: ${obj.msg}`))
	else if(obj.level == 40)
		console.log(colors.yellow(`[${dateFormat(new Date(obj.time), 'dd-mm-yy HH:MM:ss')}] WARN: ${obj.name}: ${obj.msg}`))
	else if(obj.level == 10)
		console.log(colors.blue(`[${dateFormat(new Date(obj.time), 'dd-mm-yy HH:MM:ss')}] WARN: ${obj.name}: ${obj.msg}`))
	else
		console.log(`[${dateFormat(new Date(obj.time), 'dd-mm-yy HH:MM:ss')}] INFO: ${obj.name}: ${obj.msg}`)

	next()
}

export class Util
{
	static regx = /^(\d{4,})([A-Za-z]{1}[A-Za-z0-9]?)$/i

	static consoleLog = {
		debug: (val) => console.log(val),
		info: (val) => console.log(val)
	}

	static isValidNip(str) {
		if(!str) return false
		return str.match(this.regx)
	}

	static parseEmail(str, username) {
		if(!str) return `${username}@pln.co.id`
		return str
	}

	static parseNip(str) {
		if(!this.isValidNip(str)) return undefined
		return str
	}

	static assure(value) {
		if(!value) return undefined
		return value
	}

	static logger(name, level = 'debug') {
		let log = Bunyan.createLogger({
			name: name,
			stream: consoleOut,
			level: level
		})

		return log
	}

	static redirect(url) {
		return function doRedirect(req, res, next) {
			res.redirect(url)
		}
	}

	static try(fn) {
		return (req, res, next) => {
			let p:Promise<any> = fn(req, res, next)

			p.catch(err => next(err))
		}
	}

	static decode(str) {
		return jwtDecode(str)
	}

	static encrypt(str) {
		return bcrypt.hashSync(str, '$2a$10$PgLREq6T89dMmTI0jS7oAO')
	}

	static decodeAndSplit(str) {
		str = base64.decode(str)
		str = str.split(':')
		return {key: str[0], value: str[1]}
	}

	static grantKey(str) { return `grant:${str}` }

	static toPromise(ctx, fn, args) {
		return new Promise((resolve, reject) => {
			fn.apply(ctx, args.concat([(err, data) => {
				if(err) reject(err)
				else resolve(data)
			}]))
		})
	}
}