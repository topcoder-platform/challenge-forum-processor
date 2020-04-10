/**
 * Generate a url code
 * @param str
 * @return {string}
 */
const generateUrlCode = (str) => {
  return encodeURI(str.toLowerCase().replace(/ /g, '-'))
}

module.exports = {
  generateUrlCode
}
