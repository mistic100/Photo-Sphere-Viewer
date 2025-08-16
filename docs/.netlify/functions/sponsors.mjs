let lastTime = 0;
let lastResult = null;

export default async (request) => {
    if (request.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    if (Date.now() - lastTime < 10 * 60 * 1000) {
        console.log('hit cache');
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
  user (login: "mistic100") {
    ... on Sponsorable {
      sponsorsActivities(
        first: 100,
        actions: [NEW_SPONSORSHIP, CANCELLED_SPONSORSHIP],
        includePrivate: false,
        includeAsSponsor: true,
        period: ALL,
        orderBy: { direction: ASC, field: TIMESTAMP }
      ) {
        nodes {
          action
          timestamp
          sponsorsTier {
            isOneTime
          }
          sponsor {
            ... on Actor {
              url
              login
              avatarUrl(size: 200)
            }
            ... on ProfileOwner {
              login
              name
              websiteUrl
            }
          }
        }
      }
    }
  }
}`,
        }),
    });

    const result = await response.json();

    const sponsorsActivities = result.data.user.sponsorsActivities.nodes;

    const sponsors = {};

    sponsorsActivities.forEach(({ action, sponsor, timestamp, sponsorsTier }) => {
        if (action === 'CANCELLED_SPONSORSHIP') {
            delete sponsors[sponsor.login];
        }
        if (action === 'NEW_SPONSORSHIP') {
            const niceSponsor = {
                timestamp,
                isOneTime: sponsorsTier.isOneTime,
                name: sponsor.name ?? sponsor.login,
                avatar: sponsor.avatarUrl,
                links: [
                    { icon: 'github', link: sponsor.url },
                ],
            };

            if (sponsor.websiteUrl) {
                niceSponsor.links.push(
                    { icon: 'googlehome', link: sponsor.websiteUrl }
                );
            }

            sponsors[sponsor.login] = niceSponsor;
        }
    });

    const sponsorsSorted = Object.values(sponsors)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    sponsorsSorted.forEach(sponsor => {
        delete sponsor.timestamp;
    });

    lastTime = Date.now();
    lastResult = sponsorsSorted;

    return Response.json(sponsorsSorted);
};
