const redis = require('redis');
const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);

const util = require('util');
client.get = util.promisify(client.get);


const mongoose = require('mongoose');
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
	this.useCache = true;
	
	return this;
}

mongoose.Query.prototype.exec = async function () {

	if (this.useCache) {
		console.log('The query is: ', this.getQuery(), this.mongooseCollection.name);
		const key = JSON.stringify(Object.assign({},this.getQuery(), {
			collection: this.mongooseCollection.name
		}));
		const cachedResult = await client.get(key);

		if (cachedResult) {
			console.log('The cachedResult is: ', cachedResult);
			const doc = JSON.parse(cachedResult);
			return Array.isArray(doc) ? doc.map(d => this.model(d)) : this.model(doc);
		} else {
			console.log('No cache data');
			const result = await exec.apply(this, arguments);
			client.set(key, JSON.stringify(result));
			return result;
		}

	} else {
		return exec.apply(this, arguments);
	}	

}
