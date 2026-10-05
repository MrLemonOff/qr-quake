import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as si from 'simple-icons';

const SLUGS = `github gitlab bitbucket stackoverflow npm nodedotjs javascript typescript python rust go react vuedotjs angular svelte nextdotjs
docker kubernetes linux ubuntu debian archlinux apple google amazon meta netflix spotify youtube twitch tiktok instagram facebook whatsapp telegram
signal discord slack zoom reddit pinterest snapchat x bluesky threads mastodon medium substack patreon kofi buymeacoffee paypal stripe visa mastercard
bitcoin ethereum litecoin dogecoin solana binance coinbase shopify etsy ebay airbnb uber lyft tesla bmw ford toyota nike adidas puma playstation xbox
nintendo steam epicgames unity unrealengine roblox blender figma canva notion trello jira asana dropbox googledrive wordpress wix squarespace
youtubemusic applemusic soundcloud bandcamp deezer tidal vimeo dailymotion tumblr flickr behance dribbble deviantart producthunt ycombinator quora
wechat line kakaotalk viber messenger wikipedia openai huggingface perplexity nvidia intel amd samsung huawei xiaomi sony android ios chrome firefox
safari brave opera tor linktree gumroad twitter facebooklive googlemaps googlepay applepay samsungpay alipay wise revolut klarna
tripadvisor booking expedia kayak vrbo yelp zomato ubereats grubhub starbucks mcdonalds kfc cocacola pepsi redbull ikea lego marvel dc
disney hbo hulu primevideo crunchyroll funimation netflix applearcade googleplay appstore flathub githubsponsors opencollective liberapay
godaddy namecheap cloudflare vercel netlify heroku digitalocean aws googlecloud azure oracle ibm cisco intel qualcomm raspberrypi arduino
discogs lastdotfm goodreads letterboxd imdb rottentomatoes twitter instagram snapchat`.split(/\s+/);

const bySlug = new Map(Object.entries(si).filter(([k]) => k.startsWith('si')).map(([k, v]) => [v.slug, [k, v]]));
const picked = [...new Set(SLUGS)].filter((s) => bySlug.has(s)).map((s) => bySlug.get(s));
const missing = [...new Set(SLUGS)].filter((s) => !bySlug.has(s));

const out = `import { ${picked.map(([k]) => k).join(', ')} } from 'simple-icons';

const list = [${picked.map(([k]) => k).join(', ')}];

export const BRAND_LIST = list.map((i) => ({ id: i.slug, name: i.title, path: i.path, hex: i.hex }));
`;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
fs.writeFileSync(path.join(root, 'src/core/brands-data.js'), out);
console.log(`brands-data.js: ${picked.length} brands. Not in this Simple Icons version: ${missing.join(', ') || 'none'}`);
