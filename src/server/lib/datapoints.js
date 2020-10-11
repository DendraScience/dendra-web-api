// Reasonable min and max dates to perform low-level querying
// NOTE: Didn't use min/max integer since db date conversion could choke
// NOTE: Revised to be within InfluxDB default dates
const MAX_TIME = Date.UTC(2200, 1, 2)
const MIN_TIME = Date.UTC(1800, 1, 2)

function mergeConfig(config = [], { reverse, service } = {}) {
  const stack = []

  /*
    Efficiently merge config instances in a linear traversal by evaluating each
    instance's date/time interval [begins_at, ends_before).

    Steps:
    1. Filter instances based on required fields, enabled, etc.
    2. Convert begins_at/ends_before to time; deal with nulls
    3. Sort instances by beginsAt
    4. Exclude, merge or adjust intervals
    5. Do a final reorder based on $sort.time
   */

  config
    .filter(inst => {
      return (
        typeof inst.path === 'string' &&
        !(inst.actions && inst.actions.exclude === true)
      )
    })
    .map(inst => {
      const isConn =
        typeof inst.connection === 'string' &&
        service &&
        service.connections[inst.connection]
      return {
        connection: isConn ? service.connections[inst.connection] : service,
        beginsAt:
          inst.begins_at instanceof Date ? inst.begins_at.getTime() : MIN_TIME,
        endsBefore:
          inst.ends_before instanceof Date
            ? inst.ends_before.getTime()
            : MAX_TIME,
        params1: inst.params,
        params2: isConn
          ? null
          : { actions: inst.actions, annotationIds: inst.annotation_ids },
        path: inst.path
      }
    })
    .sort((a, b) => {
      if (a.beginsAt < b.beginsAt) return -1
      if (a.beginsAt > b.beginsAt) return 1
      return 0
    })
    .forEach(inst => {
      if (inst.endsBefore <= inst.beginsAt) {
        // Exclude: inverted interval
      } else if (stack.length === 0) {
        stack.push(inst) // Init stack
      } else {
        const top = stack[stack.length - 1]

        if (inst.beginsAt >= top.endsBefore) {
          stack.push(inst)
        } else if (inst.endsBefore <= top.endsBefore) {
          // Exclude: instance interval is within top interval
        } else if (inst.beginsAt === top.beginsAt) {
          stack.pop()
          stack.push(inst)
        } else {
          top.endsBefore = inst.beginsAt
          stack.push(inst)
        }
      }
    })

  return reverse ? stack.reverse() : stack
}

module.exports = {
  mergeConfig,

  MAX_TIME,
  MIN_TIME
}
