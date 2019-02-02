const redis = require('redis');
const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);

const util = require('util');
client.get = util.promisify(client.get);


const mongoose = require('mongoose');
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
	this.useCache = true;
	this.hashKey = JSON.stringify(options.key || '');
	return this;
}

mongoose.Query.prototype.exec = async function () {

	if (this.useCache) {
		// console.log('The query is: ', this.getQuery(), this.mongooseCollection.name);
		const key = JSON.stringify(Object.assign({},this.getQuery(), {
			collection: this.mongooseCollection.name
        }));
        console.log('The hashkey and key is: ', this.hashKey, key);
		const cachedResult = await client.hget(this.hashKey, key);

		if (cachedResult) {
			console.log('The cachedResult is: ', cachedResult);
			const doc = JSON.parse(cachedResult);
			return Array.isArray(doc) ?
			    doc.map(d => this.model(d)) :
			    this.model(doc);
		} else {
			const result = await exec.apply(this, arguments);
			client.hset(this.hashKey, key, JSON.stringify(result));
			console.log('returning from query ', result);
			return result;
		}

	} else {
		return exec.apply(this, arguments);
	}	

}

module.exports = {
	clearHash(hashKey) {
		console.log('clear has called', hashKey);
		client.del(JSON.stringify(hashKey));
	}
}
