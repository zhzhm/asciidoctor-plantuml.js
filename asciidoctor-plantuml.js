/* global Opal */
const plantumlEncoder = require('plantuml-encoder')

function createImageSrc (serverUrl, shouldFetch, outdir, text) {
  let diagramUrl = `${serverUrl}/png/${plantumlEncoder.encode(text)}`
  if (shouldFetch) {
    diagramUrl = require('./lib/fetch').save(diagramUrl, outdir)
  }
  return diagramUrl
}

function plantumlBlock () {
  this.named('plantuml')
  this.onContext('listing')

  this.process((parent, reader, attrs) => {
    const doc = parent.getDocument()
    const diagramText = reader.getLines().join('\n')
    const serverUrl = process.env.PLANTUML_SERVER_URL || doc.getAttribute('plantuml-server-url')
    let roles = Opal.hash_get(attrs, 'role')
    let blockId = Opal.hash_get(attrs, 'id')
    if (serverUrl) {
      const shouldFetch = doc.isAttribute('plantuml-fetch-diagram')
      const imagesOutDir = doc.getAttribute('imagesoutdir')
      const imageUrl = createImageSrc(serverUrl, shouldFetch, imagesOutDir, diagramText)
      const blockAttrs = {role: roles ? `${roles} plantuml` : 'plantuml', target: imageUrl, alt: 'diagram'}
      if (blockId) blockAttrs['id'] = blockId
      return this.createImageBlock(parent, blockAttrs, blockAttrs)
    } else {
      console.warn('Skipping plantuml block. PlantUML Server URL not defined in plantuml-server-url attribute or PLANTUML_SERVER_URL environment variable.')
      Opal.hash_put(attrs, 'role', roles ? `${roles} plantuml-error` : 'plantuml-error')
      return this.createBlock(parent, 'listing', diagramText, attrs)
    }
  })
}

module.exports.register = function register (registry) {
  if (typeof registry.register === 'function') {
    registry.register(function () {
      this.block(plantumlBlock)
    })
  } else if (typeof registry.block === 'function') {
    registry.block('plantuml', plantumlBlock)
  }
  return registry
}
