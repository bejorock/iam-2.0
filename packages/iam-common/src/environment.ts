export class environment
{
	static defaultDb = 'defaultDb'
	static sapDb = 'sapDb'
	static jwtSecret = '246bace2-38cb-4138-85d9-0ae8160b07c8'
	static salt = 'iamplnsecret'
	static elasticHost = process.env.ELASTIC_HOST || 'localhost:9200'
}