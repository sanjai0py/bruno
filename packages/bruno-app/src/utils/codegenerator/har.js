const getContentType = (mode) => {
  const contentTypes = {
    json: 'application/json',
    text: 'text/plain',
    xml: 'application/xml',
    sparql: 'application/sparql-query',
    formUrlEncoded: 'application/x-www-form-urlencoded',
    graphql: 'application/json',
    multipartForm: 'multipart/form-data'
  };
  return contentTypes[mode] || '';
};

export const parseGraphQLRequestBody = (request) => {
  if (request?.body?.mode === 'graphql' && request.body?.graphql) {
    try {
      const { graphql } = request.body;

      if (typeof graphql.variables === 'string') {
        graphql.variables = JSON.parse(graphql.variables);
      }

      request.body.graphql = {
        query: graphql.query,
        variables: graphql.variables
      };
    } catch (e) {
      console.error('Failed to parse GraphQL variables', e);
    }
  }
};

const createHeaders = (request, headers) => {
  const enabledHeaders = headers.filter((header) => header.enabled).map(({ name, value }) => ({ name, value }));

  const contentType = getContentType(request.body?.mode);
  if (contentType) {
    enabledHeaders.push({ name: 'content-type', value: contentType });
  }
  return enabledHeaders;
};

const createQuery = (queryParams = []) =>
  queryParams.filter((param) => param.enabled && param.type === 'query').map(({ name, value }) => ({ name, value }));

const createPostData = (body) => {
  const contentType = getContentType(body.mode);

  if (body.mode === 'graphql' && body.graphql) {
    return {
      mimeType: 'application/json',
      text: JSON.stringify({
        query: body.graphql.query || '', //This could break if no query values?
        variables: body.graphql.variables || {}
      })
    };
  }

  if (body.mode === 'formUrlEncoded' || body.mode === 'multipartForm') {
    return {
      mimeType: contentType,
      params: body[body.mode]
        .filter((param) => param.enabled)
        .map(({ name, value, type }) => ({
          name,
          value,
          ...(type === 'file' && { fileName: value })
        }))
    };
  }

  return {
    mimeType: contentType,
    text: body[body.mode]
  };
};

export const buildHarRequest = ({ request, headers }) => {
  parseGraphQLRequestBody(request);

  return {
    method: request.method,
    url: encodeURI(request.url),
    httpVersion: 'HTTP/1.1',
    cookies: [],
    headers: createHeaders(request, headers),
    queryString: createQuery(request.params),
    postData: createPostData(request.body),
    headersSize: 0,
    bodySize: 0
  };
};