const redis = require('redis');
const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);

const util = require('util');
client.get = util.promisify(client.get);


const mongoose = require('mongoose');
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = async function () {

	console.log('The query is: ', this.getQuery(), this.mongooseCollection.name);
	const result = await exec.apply(this, arguments);
	return result;
}
