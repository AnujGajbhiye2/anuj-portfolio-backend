import http from 'k6/http';
import { sleep, check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3002';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // ramp up to 50 users
    { duration: '5m', target: 50 },   // stay at 50
    { duration: '2m', target: 100 },  // ramp up to 100
    { duration: '5m', target: 100 },  // stay at 100
    { duration: '2m', target: 0 },    // ramp down
  ],
};

export default function () {
  // health check
  let health = http.get(`${BASE_URL}/api/health`);
  check(health, { 'health 200': (r) => r.status === 200 });

  sleep(1);

  // list blog posts
  let blogs = http.get(`${BASE_URL}/api/blogs`);
  check(blogs, { 'blogs 200': (r) => r.status === 200 });

  sleep(1);

  // record page view — body must match pageViewSchema: { path, title?, referrer? }
  let pv = http.post(
    `${BASE_URL}/api/analytics/page-view`,
    JSON.stringify({ path: '/home', title: 'Home' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(pv, { 'page-view 202': (r) => r.status === 202 });

  sleep(2);
}
