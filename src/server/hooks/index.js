// Add any common hooks you want to share across services in here.
//
// Below is an example of how a hook is written and exported. Please
// see http://docs.feathersjs.com/hooks/readme.html for more details
// on hooks.
//
// exports.myHook = (options) => {
//   return (hook) => {
//     console.log('My custom global hook ran. Feathers is awesome!')
//   }
// }

const accessFind = require('./accessFind')
const accessGet = require('./accessGet')
const beforeCreate = require('./beforeCreate')
const beforeFind = require('./beforeFind')
const beforeGet = require('./beforeGet')
const beforePatch = require('./beforePatch')
const beforeRemove = require('./beforeRemove')
const beforeUpdate = require('./beforeUpdate')
const restrictQueryToAbility = require('./restrictQueryToAbility')
const restrictToAbility = require('./restrictToAbility')
const setAbility = require('./setAbility')
const versionStamp = require('./versionStamp')

module.exports = {
  accessFind,
  accessGet,
  beforeCreate,
  beforeFind,
  beforeGet,
  beforePatch,
  beforeRemove,
  beforeUpdate,
  restrictQueryToAbility,
  restrictToAbility,
  setAbility,
  versionStamp
}
