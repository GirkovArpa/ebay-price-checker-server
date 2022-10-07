import fetch from 'node-fetch';

const { PORT, RU_NAME, APP_ID, DEV_ID, CERT_ID } = process.env;

export async function* getPrices(ids) {
  const token = await getToken();
  for await (const { Item: items } of getMultipleItems(ids, token)) {
    const prices = items.map(
      ({
        ItemID: id,
        CurrentPrice: { Value: price },
        Quantity: quantity,
        ListingStatus: status,
        ShippingCostSummary: {
          ShippingServiceCost: { Value: shipping },
        }
      }) => ({
        id,
        price: price + shipping,
        quantity,
        status,
      })
    );
    yield prices;
  }
}

async function* getMultipleItems(ids, token) {
  const chunks = chunkArray(ids, 20);
  for (const ids of chunks) {
    const url = `https://api.ebay.com/Shopping?appid=${APP_ID}&callname=GetMultipleItems&version=967&siteid=0&responseencoding=JSON&IncludeSelector=Details,ShippingCosts&ItemID=${ids}`;
    const resp = await fetch(url, {
      headers: {
        'X-EBAY-API-IAF-TOKEN': token,
      },
    });
    const json = await resp.json();
    yield json;
  }
}

async function getToken() {
  const resp = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${APP_ID}:${CERT_ID}`)}`,
      'cache-control': 'no-cache',
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
    },
    body:
      'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
  });
  const { access_token } = await resp.json();
  return access_token;
}

function chunkArray(arr, chunkSize) {
  const output = [];
  for (let i = 0, len = arr.length; i < len; i += chunkSize) {
    output.push(arr.slice(i, i + chunkSize));
  }
  return output;
}
