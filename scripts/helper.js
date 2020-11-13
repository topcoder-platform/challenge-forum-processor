/**
 * Generate a url code
 * @param str
 * @return {string}
 */
const generateUrlCode = (str) => {
  return encodeURI(str.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '').replace(/ /g, '-'))
}

module.exports = {
  generateUrlCode
}
