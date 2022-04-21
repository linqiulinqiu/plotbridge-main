const moment = require('moment')
const Vue = require('vue').default

function formatRelTS(ts){
    if(typeof(ts)!='number'){
        ts = ts.toNumber()
    }
    const m = moment.unix(ts)
    return m.fromNow()
}

function formatDuration(secs, suffix){
    if(typeof(secs)!='number'){
        secs = secs.toNumber()
    }
    const d = moment.duration(secs, 'seconds')
    return d.humanize(suffix)
}

exports.formatRelTS = formatRelTS
exports.formatD = formatDuration
