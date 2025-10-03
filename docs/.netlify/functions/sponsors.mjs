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
  user (login: "mistic100") {
    ... on Sponsorable {
      sponsorsActivities(
        first: 100,
        actions: [NEW_SPONSORSHIP, CANCELLED_SPONSORSHIP],
        includePrivate: false,
        period: ALL,
        orderBy: { direction: ASC, field: TIMESTAMP }
      ) {
        nodes {
          action
          timestamp
          sponsorsTier {
            isOneTime
            monthlyPriceInDollars
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

    const sponsorsActivities = result.data?.user?.sponsorsActivities?.nodes;

    if (!sponsorsActivities) {
        return new Response('Failed to fetch sponsors', { status: 500 });
    }

    const sponsors = {};

    sponsorsActivities.forEach(({ action, sponsor, timestamp, sponsorsTier }) => {
        if (action === 'CANCELLED_SPONSORSHIP') {
            delete sponsors[sponsor.login];
        }
        if (action === 'NEW_SPONSORSHIP') {
            if (sponsorsTier.isOneTime && sponsorsTier.monthlyPriceInDollars < 10) {
                return;
            }

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
                    { icon: 'googlehome', link: sponsor.websiteUrl },
                );
            }

            sponsors[sponsor.login] = niceSponsor;
        }
    });

    const sponsorsSorted = Object.values(sponsors)
        .sort((a, b) => {
            if (a.isOneTime === b.isOneTime) {
                return b.timestamp.localeCompare(a.timestamp);
            } else {
                return a.isOneTime ? 1 : -1;
            }
        })
        .map((sponsor) => {
            delete sponsor.timestamp;
            delete sponsor.isOneTime;
            return sponsor;
        });

    lastTime = Date.now();
    lastResult = sponsorsSorted;

    return Response.json(sponsorsSorted);
};
