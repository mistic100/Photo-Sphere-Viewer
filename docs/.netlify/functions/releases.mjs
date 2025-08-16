const CACHE_TTL = 10 * 60 * 1000;

let lastTime = 0;
let lastResult = null;

export default async (request) => {
    if (request.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    if (Date.now() - lastTime < CACHE_TTL) {
        console.log('Cache hit');
        return Response.json(lastResult);
    }

    const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            Authorization: `bearer ${process.env.GH_TOKEN}`,
        },
        body: JSON.stringify({
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
    });

    const result = await response.json();

    const releases = result.data?.repository?.releases?.nodes;

    if (!releases) {
        return new Response('Failed to fetch releases', { status: 500 });
    }

    lastTime = Date.now();
    lastResult = releases;

    return Response.json(releases);
};
