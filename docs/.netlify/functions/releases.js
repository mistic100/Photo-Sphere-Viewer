exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  return await fetch('https://api.github.com/graphql', {
    method : 'POST',
    headers: {
      'Authorization': `bearer ${process.env.GH_TOKEN}`,
    },
    body   : JSON.stringify({
      query: `
        query {
          repository(owner: "mistic100", name: "photo-sphere-viewer") {
            releases(first: 20, orderBy: {field: CREATED_AT, direction: DESC}) {
              nodes {
                id
                name
                description
                publishedAt
                url
              }
            }
          }
        }`,
    }),
  })
    .then(response => response.json())
    .then(result => {
        const releases = result.data.repository.releases.nodes;
        return {
          statusCode: 200,
          body: JSON.stringify(releases)
        };
    });
};
