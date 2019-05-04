const { getItems } = require('feathers-hooks-common')
const { ObjectID } = require('mongodb')

module.exports = () => {
  return context => {
    if (context.type !== 'before') {
      throw new Error(
        "The 'versionStamp' hook should only be used as a 'before' hook."
      )
    }

    let items = getItems(context)
    if (!Array.isArray(items)) items = [items]

    items.forEach(item => {
      item.version_id = new ObjectID()
    })

    return context
  }
}
