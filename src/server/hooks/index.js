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

// TODO: Add option to ValidationContext for servicePath?

const Ajv = require('ajv')
const url = require('url')
const {errors} = require('feathers-errors')

let validationContext // Singleton

class ValidationContext {
  constructor (app) {
    this.app = app
    this.validators = {}
    this.ajv = new Ajv({
      loadSchema: this.loadSchema.bind(null, app)
    })

    // TODO: Deprecate this!
    // this.ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'))
  }

  /**
   * Asynchronous function that will be used to load remote schemas when the
   * method compileAsync is used and some reference is missing.
   */
  loadSchema (app, uri) {
    const parsed = url.parse(uri)
    return app.service('/system/schemas').get(parsed.pathname)
  }

  getValidator (schemaName) {
    const self = this
    const validate = self.validators[schemaName]

    if (validate) return Promise.resolve(validate)

    return self.app.service('/system/schemas').get(schemaName).then(schema => {
      return self.ajv.compileAsync(schema)
    }).then(validate => {
      self.validators[schemaName] = validate // Cache in memory
      return validate
    })
  }
}

exports.validate = (schemaName) => {
  return (hook) => {
    if (!hook.params.provider && hook.params.noValidate) return // Skip?

    // Lazy init to ensure the async loader gets an app reference
    if (!validationContext) validationContext = new ValidationContext(hook.app)

    return validationContext.getValidator(schemaName).then(validate => {
      if (validate(hook.data)) return hook
      throw new errors.BadRequest('Validation failed', {
        errors: validate.errors
      })
    })
  }
}
