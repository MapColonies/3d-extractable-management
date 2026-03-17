export const DEFAULT_START_POSITION = 1;
export const DEFAULT_MAX_RECORDS = 100;

export const options = {
  attributeNamePrefix: '',
  attrNodeName: 'attr',
  textNodeName: '#text',
  parseTagValue: true,
  ignoreAttributes: false,
  ignoreNameSpace: false,
  allowBooleanAttributes: true,
  parseNodeValue: true,
  parseAttributeValue: true,
  trimValues: true,
  cdataTagName: '__cdata',
  cdataPositionChar: '\\c',
  parseTrueNumberOnly: false,
  numParseOptions: {
    hex: true,
    leadingZeros: true,
  },
  alwaysCreateTextNode: false,
};

export const NAMESPACES = {
  csw: 'http://www.opengis.net/cat/csw/2.0.2',
  ogc: 'http://www.opengis.net/ogc',
  gml: 'http://www.opengis.net/gml',
  ows: 'http://www.opengis.net/ows',
  mc: 'http://schema.mapcolonies.com/3d',
};

export const namespaceString = Object.entries(NAMESPACES)
  .map(([key, value]) => `xmlns:${key}="${value}"`)
  .join(' ');
