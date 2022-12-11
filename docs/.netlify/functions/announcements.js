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
            pinnedDiscussions(first: 2) {
              nodes {
                discussion {
                  title
                  createdAt
                  url
                  body
                }
              }
            }
          }
        }`,
    }),
  })
    .then(response => response.json())
    .then(result => {
        const announcements = result.data.repository.pinnedDiscussions.nodes.map(n => n.discussion);
        return {
          statusCode: 200,
          body: JSON.stringify(announcements)
        };
    });
};
