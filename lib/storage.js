const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const path = require('path')
 
const adapter = new FileSync(path.join(__dirname, '..', 'storage/db.json'))
const db = low(adapter)
 
db.defaults({ browser_profile: {}, credential: {} }).write()
 
module.exports = db