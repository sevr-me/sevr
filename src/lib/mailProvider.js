import { gmailAdapter } from './gmailAdapter'
import { outlookAdapter } from './outlookAdapter'

const adapters = { gmail: gmailAdapter, outlook: outlookAdapter }

export const getAdapter = (type) => adapters[type]
