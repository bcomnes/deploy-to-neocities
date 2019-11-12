import tape from 'tape';
import ptape from 'tape-promise';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { NeocitiesAPIClient } from './lib/client.js';
const test = ptape(tape);

let token = process.env.NEOCITIES_API_TOKEN;

if (!token) {
  try {
    const config = JSON.parse(readFileSync(resolve(__dirname, 'config.json')));
    token = config.token;
  } catch (e) {
    console.warn('error loading config.json');
    console.warn(e);
  }
}

if (token) {
  test('token loaded', async t => {
    t.ok(token);
  });

  test('basic client api', async t => {
    const client = new NeocitiesAPIClient(token);

    t.ok(client.info, 'info method available');
    t.ok(client.list, 'list method available');
    t.ok(client.get, 'get method available');
    t.ok(client.post, 'post method available');
  });

  test('can get info about site', async t => {
    const client = new NeocitiesAPIClient(token);

    const info = await client.info();
    console.log(info);
    const list = await client.list();
    console.log(list);
  });
} else {
  console.warn('No token set, live tests disabled');
}
